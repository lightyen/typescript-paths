const path = require("path")
const glob = require("glob")
const { TsPathsResolvePlugin } = require("ts-paths-resolve-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const src = path.join(__dirname, "src")
process.env.NODE_ENV = "development"

/** @type {import("webpack").Configuration} */
const config = {
	mode: "development",
	devtool: "inline-source-map",
	entry: glob.sync("index.*", { cwd: src }).map(i => path.join(src, i)),
	output: {
		path: path.join(__dirname, "build"),
		filename: "js/[name].js?[fullhash]",
		clean: true,
	},
	module: {
		rules: [{ test: /\.(j|t)s?/, loader: "babel-loader" }],
	},
	plugins: [new HtmlWebpackPlugin()],
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
		plugins: [new TsPathsResolvePlugin({ tsConfigPath: "src/tsconfig.json", logLevel: "debug" })],
	},
	devServer: {
		hot: true,
		open: false,
		historyApiFallback: true,
	},
}

module.exports = config
