import path from "path"
import { createHandler } from "../../src"

test("resolving", async () => {
	const handler = createHandler({ tsConfigPath: path.resolve(__dirname, "tsconfig.json") })
	expect(handler).toBeTruthy()
	if (!handler) return
	const resolve = (request: string) => handler(request, path.resolve(__dirname, "main.tsx"))
	expect(resolve("~/App")).toEqual(path.resolve(__dirname, "src/App.tsx"))
	expect(resolve("~/App.js")).toEqual(path.resolve(__dirname, "src/App.tsx"))
	expect(resolve("~/App.jsx")).toEqual(path.resolve(__dirname, "src/App.tsx"))
	expect(resolve("~/Svg.svg")).toEqual(path.resolve(__dirname, "src/Svg.svg.ts"))
})
