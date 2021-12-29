import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"

export default [
	{
		input: ["src/index.ts", "src/register.ts"],
		output: [
			{
				dir: "lib/esm",
				format: "esm",
			},
			{
				dir: "lib",
				format: "cjs",
				exports: "named",
				chunkFileNames: "[hash].js",
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
