import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import tsPaths from "rollup-plugin-tsconfig-paths"

export default [
	{
		input: "src/index.ts",
		preserveEntrySignatures: "strict",
		output: {
			dir: "build",
			format: "esm",
		},
		plugins: [
			babel({
				babelHelpers: "bundled",
				exclude: "node_modules/**",
			}),
			tsPaths({ tsConfigPath: "src/tsconfig.json" }),
			nodeResolve({ extensions: [".tsx", ".ts", ".jsx", ".js", ".json"] }),
			commonjs(),
		],
	},
]
