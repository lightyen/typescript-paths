import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"

export default [
	{
		input: "index.ts",
		output: [
			{
				file: "lib/index.js",
				format: "cjs",
				exports: "named",
			},
			{
				file: "lib/esm/index.js",
				format: "esm",
			},
		],
		plugins: [
			babel({
				babelHelpers: "bundled",
				extensions: [".js", ".ts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".ts"] }),
			commonjs(),
		],
		external: ["fs", "path", "typescript", "typescript-paths"],
	},
]
