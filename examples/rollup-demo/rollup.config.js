import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import run from "@rollup/plugin-run"
import tsConfigPaths from "rollup-plugin-tsconfig-paths"

/** @type {import("rollup").RollupOptions} */
export default {
	input: "./src/index.ts",
	output: {
		format: "esm",
		dir: "./dist",
	},
	plugins: [
		babel({
			babelHelpers: "bundled",
			extensions: [".ts", ".js"],
		}),
		tsConfigPaths(),
		nodeResolve({ extensions: [".ts", ".js", ".json"] }),
		commonjs(),
		run(),
	],
}
