// Checks the published types with different TypeScript versions, the way a user of the package sees them:
// the package is packed, installed with npm into a temporary project and the type tests import it by name,
// both from an ES module and from a CommonJS module.
// Usage: node scripts/types-compat.mjs [typescript versions...]
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const DEFAULT_VERSIONS = ["4.9", "5.0", "5.4", "5.9", "6.0", "7.0", "latest"];
const root = new URL("..", import.meta.url).pathname;
const versions = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_VERSIONS;
const { devDependencies } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const shell = process.platform === "win32";
const run = (command, args, cwd) => execFileSync(command, args, { cwd, shell, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

const tests = readFileSync(join(root, "src/test/types.test-d.ts"), "utf8");
const consumerTests = tests.replace("import merge from \"../index.js\";", "import merge from \"merge-deep-ts\";");
if (consumerTests === tests) {
	throw new Error("The type tests must import merge from \"../index.js\"");
}

const workspace = mkdtempSync(join(tmpdir(), "merge-deep-ts-types-"));
const tarball = join(workspace, "package.tgz");
console.log(`Packing the package into ${tarball}`);
run("yarn", ["pack", "--out", tarball], root);

const failed = [];
for (const version of versions) {
	const project = join(workspace, `typescript-${version}`);
	mkdirSync(project);
	writeFileSync(join(project, "package.json"), JSON.stringify({ name: "consumer", private: true }));
	writeFileSync(join(project, "tsconfig.json"), JSON.stringify({
		compilerOptions: {
			strict: true,
			noEmit: true,
			target: "ES2020",
			module: "NodeNext",
			moduleResolution: "NodeNext",
			types: [],
			skipLibCheck: true,
		},
		include: ["esm", "cjs"],
	}));
	for (const [folder, type] of [["esm", "module"], ["cjs", "commonjs"]]) {
		mkdirSync(join(project, folder));
		writeFileSync(join(project, folder, "package.json"), JSON.stringify({ type }));
		writeFileSync(join(project, folder, "types.test.ts"), consumerTests);
	}
	cpSync(tarball, join(project, "package.tgz"));
	run("npm", [
		"install", "--no-audit", "--no-fund", "--no-package-lock", "--ignore-scripts",
		`typescript@${version}`, `expect-type@${devDependencies["expect-type"]}`, "./package.tgz",
	], project);
	const installed = JSON.parse(readFileSync(join(project, "node_modules/typescript/package.json"), "utf8")).version;
	try {
		run(join(project, "node_modules/.bin/tsc"), ["--project", "tsconfig.json"], project);
		console.log(`✔ TypeScript ${installed} (${version})`);
	} catch (error) {
		failed.push(version);
		console.log(`✖ TypeScript ${installed} (${version})\n${error.stdout}${error.stderr}`);
	}
}

if (failed.length > 0) {
	console.log(`Type tests failed with TypeScript ${failed.join(", ")}. The temporary projects are kept in ${workspace}`);
	process.exitCode = 1;
} else {
	rmSync(workspace, { recursive: true, force: true });
}
