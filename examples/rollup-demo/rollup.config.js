import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import tsConfigPaths from "rollup-plugin-tsconfig-paths"

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
			tsConfigPaths({ tsConfigPath: "src/tsconfig.json" }),
			nodeResolve({ extensions: [".tsx", ".ts", ".jsx", ".js", ".json"] }),
			commonjs(),
		],
	},
]
