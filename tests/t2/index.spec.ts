import { existsSync } from "fs"
import path from "path"
import { createHandler } from "../../src"

test("support project references", async () => {
	const handler = createHandler({
		falllback: moduleName => (existsSync(moduleName) ? moduleName : undefined),
		tsConfigPath: path.resolve(__dirname, "app/tsconfig.json"),
	})
	expect(handler).toBeTruthy()
	if (!handler) return
	expect(handler("helpers/bar", path.resolve(__dirname, "shared/foo.ts"))).toEqual(
		path.resolve(__dirname, "shared/my-helpers/bar.ts"),
	)
	expect(handler("helpers/bar", path.resolve(__dirname, "shared2/foo.ts"))).toEqual(
		path.resolve(__dirname, "shared2/my-helpers/bar.ts"),
	)
	expect(handler("img/pic.svg", path.resolve(__dirname, "shared/foo.ts"))).toEqual(
		path.resolve(__dirname, "shared/pic.svg"),
	)
	expect(handler("img/pic.svg", path.resolve(__dirname, "shared2/foo.ts"))).toEqual(
		path.resolve(__dirname, "shared2/pic.svg"),
	)
})
