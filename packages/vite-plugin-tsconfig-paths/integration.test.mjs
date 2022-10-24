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
	const fn = require(".")
	expect(fn).toHaveProperty("name", "tsConfigPaths")
	expect(fn["default"]).toHaveProperty("name", "tsConfigPaths")
})

test("load ES module", async () => {
	const fn = await import(".").then(m => m.default)
	expect(fn).toHaveProperty("name", "tsConfigPaths")
})
