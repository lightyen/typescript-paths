import path from "path"
import { createHandler } from "../../src"

test("support extends", async () => {
	const handler = createHandler({
		tsConfigPath: path.resolve(__dirname, "src/tsconfig.json"),
	})
	expect(handler).toBeTruthy()
	if (!handler) return
	expect(handler("common/hello", path.resolve(__dirname, "src/main.ts"))).toEqual(
		path.resolve(__dirname, "util/common/hello.ts"),
	)
})
