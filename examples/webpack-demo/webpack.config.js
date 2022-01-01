const path = require("path")
const glob = require("glob")
const { TsPathsResolvePlugin } = require("ts-paths-resolve-plugin")

const src = path.join(__dirname, "src")

/** @type {import("webpack").Configuration} */
const config = {
	mode: "production",
	entry: glob.sync("index.*", { cwd: src }).map(i => path.join(src, i)),
	output: {
		path: path.join(__dirname, "build"),
		filename: "js/[name].js?[fullhash]",
		clean: true,
	},
	plugins: [
		new TsPathsResolvePlugin({ tsConfigPath: "src/tsconfig.json" }),
	],
	module: {
		rules: [{ test: /\.(j|t)s?/, loader: "babel-loader" }],
	},
}

module.exports = config
