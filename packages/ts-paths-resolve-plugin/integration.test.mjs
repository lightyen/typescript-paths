import { createRequire } from "module"

test("load CommonJS module", () => {
	const require = createRequire(import.meta.url)
	const fn = require(".")
	expect(fn).toHaveProperty("name", "TsPathsResolvePlugin")
})

test("load ES module", async () => {
	const fn = await import(".").then(m => m.default)
	expect(fn).toHaveProperty("name", "TsPathsResolvePlugin")
})
