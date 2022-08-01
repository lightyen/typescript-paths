import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"

export default [
	{
		input: "index.ts",
		output: [
			{
				file: "lib/index.cjs",
				format: "cjs",
				exports: "auto",
			},
			{
				file: "lib/esm/index.mjs",
				format: "esm",
			},
		],
		plugins: [
			babel({
				babelHelpers: "bundled",
				extensions: [".js", ".ts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".js", ".ts"] }),
			commonjs(),
		],
		external: ["fs", "path", "typescript", "typescript-paths"],
	},
]
