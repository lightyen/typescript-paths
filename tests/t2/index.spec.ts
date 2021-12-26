import { existsSync } from "fs"
import path from "path"
import { createHandler, createLogger, LogLevel } from "../../src"

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

test("bad tsconfig", async () => {
	const handler = createHandler({
		log: createLogger({ logLevel: LogLevel.None }),
		falllback: moduleName => (existsSync(moduleName) ? moduleName : undefined),
		tsConfigPath: path.resolve(__dirname, "app/bad.tsconfig.json"),
	})
	expect(handler).toBeFalsy()
})
