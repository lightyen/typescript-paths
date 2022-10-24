import { createRequire } from "module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

function getPathURL(basename) {
	return pathToFileURL(
		path.join(path.dirname(fileURLToPath(import.meta.url)), basename),
	)
}

test("load CommonJS module", () => {
	const require = createRequire(getPathURL("index.js"))
	const tsConfigPaths = require(".")
	expect(tsConfigPaths).toHaveProperty("name", "tsConfigPaths")
	expect(tsConfigPaths["default"]).toHaveProperty("name", "tsConfigPaths")
})

test("load ES module", async () => {
	const tsConfigPaths = await import(getPathURL("./index.mjs")).then(
		m => m.default,
	)
	expect(tsConfigPaths).toHaveProperty("name", "tsConfigPaths")
})
