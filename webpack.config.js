import path from "path";
import TerserPlugin from "terser-webpack-plugin";
const __dirname = path.resolve();

/**
 *
 * @param env
 * @returns { import("webpack").Configuration }
 */
export default env => {
	const { mode = "development" } = env;
	const isProd = mode === "production";

	return {
		context: path.resolve(__dirname, "./src"),
		mode,
		entry: "./index.ts",
		output: {
			filename: "index.js",
			path: path.resolve(__dirname, "dist"),
			clean: true,
			library: {
				type: "module",
				export: "default",
			},
		},
		experiments: {
			outputModule: true,
		},
		module: {
			rules: [
				{
					test: /\.[jt]s$/,
					exclude: /node_modules/,
					use: "ts-loader",
				},
			],
		},
		resolve: {
			extensions: [".ts", ".js"],
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		devtool: false,
		plugins: [],
		optimization: {
			minimize: isProd,
			minimizer: [
				new TerserPlugin({
					// `terserOptions` options will be passed to `esbuild`
					// Link to options - https://esbuild.github.io/api/#minify
					// Note: the `minify` options is true by default (and override other `minify*` options), so if you want to disable the `minifyIdentifiers` option (or other `minify*` options) please use:
					// terserOptions: {
					//   minify: false,
					//   minifyWhitespace: true,
					//   minifyIdentifiers: false,
					//   minifySyntax: true,
					// },
					terserOptions: {
						ecma: 2020,
					},
				}),
			],
		},
	};
};
