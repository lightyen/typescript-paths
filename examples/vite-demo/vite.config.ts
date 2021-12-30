import { defineConfig } from "vite"
import { tsConfigPaths } from "vite-plugin-tsconfig-paths"

export default defineConfig({
	build: {
		outDir: "build",
	},
	plugins: [tsConfigPaths({ tsConfigPath: "src/tsconfig.json" })],
})
