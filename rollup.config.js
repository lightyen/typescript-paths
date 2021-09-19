import babel from "@rollup/plugin-babel"
import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import pkg from "./package.json"

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: pkg.module,
				format: "esm",
				sourcemap: true,
			},
			{
				file: pkg.main,
				format: "cjs",
				exports: "named",
				sourcemap: true,
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
		external: ["fs", "path", "typescript"],
	},
]
