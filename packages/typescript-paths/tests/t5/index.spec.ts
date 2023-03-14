import path from "path"
import { createHandler } from "../../src"

test("resolving extends", async () => {
	const handler = createHandler({
		tsConfigPath: [path.resolve(__dirname, "tsconfig.json")],
	})
	expect(handler).toBeTruthy()
	if (!handler) return
	// expect(handler("@/module", path.resolve(__dirname, "src/com/index.ts"))).toEqual(
	// 	path.resolve(__dirname, "src/com/src/module.ts"),
	// )
	// expect(handler("!/com", path.resolve(__dirname, "src/index.ts"))).toEqual(
	// 	path.resolve(__dirname, "src/com/index.ts"),
	// )
	// expect(handler("!/com/src/module", path.resolve(__dirname, "src/index.ts"))).toEqual(
	// 	path.resolve(__dirname, "src/com/src/module.ts"),
	// )
	// expect(handler("@/module", path.resolve(__dirname, "src/index.ts"))).toEqual(undefined)
	// expect(handler("@/module", path.resolve(__dirname, "src/com/index.ts"))).toEqual(
	// 	path.resolve(__dirname, "src/com/src/module.ts"),
	// )
	// // false positive
	// expect(handler("!/com", path.resolve(__dirname, "src/com/index.ts"))).toEqual(undefined)
	// expect(handler("!/com/src/module", path.resolve(__dirname, "src/com/index.ts"))).toEqual(undefined)
})
