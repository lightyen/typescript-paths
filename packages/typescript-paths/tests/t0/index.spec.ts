import path from "path"
import { createHandler } from "../../src"

test("resolving", async () => {
	const handler = createHandler({ searchPath: __dirname })
	expect(handler).toBeTruthy()
	if (!handler) return
	const resolve = (request: string) => handler(request, path.resolve(__dirname, "demo.ts"))
	expect(resolve("~/hello")).toEqual(path.resolve(__dirname, "hello.ts"))
	expect(handler("~/hello", path.resolve(__dirname, "undefined.ts"))).toEqual(undefined)
	expect(resolve("~/qqq/hello")).toEqual(path.resolve(path.join(__dirname, "qqq/hello.js")))
	expect(handler("~/hello", path.resolve(__dirname, "undefined.ts"))).toEqual(undefined)
	expect(resolve("@xxx/abc/xxx")).toEqual(path.resolve(__dirname, "xyz/abc/xyz.ts"))
	expect(resolve("@xxx/fff")).toEqual(path.resolve(__dirname, "abc/fff.js"))
	expect(resolve("#m/abc")).toEqual(path.resolve(__dirname, "xyz/abc/xyz.ts"))
	expect(resolve("#m/fff")).toEqual(path.resolve(__dirname, "abc/fff.js"))
	const r = resolve("roll")
	if (r) expect(require.resolve(r)).toEqual(require.resolve("rollup"))
	expect(resolve("./t0/abc/App")).toEqual(undefined)
	expect(resolve("rollup")).toEqual(undefined)
	expect(resolve("@p")).toEqual(path.resolve(__dirname, "xx/qq.ts"))
	expect(resolve("@q")).toEqual(path.resolve(__dirname, "xx/ee.ts"))
	expect(resolve("#v")).toEqual(path.resolve(__dirname, "xx/vv.abs.ts"))
	expect(resolve("@v")).toEqual(path.resolve(__dirname, "xx/vv.abs.ts"))
	expect(resolve("ee")).toEqual(path.resolve(__dirname, "xx/ee.ts"))
	expect(resolve("ff")).toEqual(path.resolve(__dirname, "xx/ff.ts"))
	expect(resolve("path")).toEqual(undefined)
})

test("support memory tsconfig", async () => {
	const handler = createHandler({
		respectCoreModule: false,
		tsConfigPath: {
			compilerOptions: {
				pathsBasePath: path.resolve(__dirname),
				paths: {
					"~/*": ["./*"],
					"@xxx/*/xxx": ["./xyz/*/xyz"],
					"@xxx/*": ["./abc/*"],
					"#m/*": ["./abc/*", "./xyz/*/xyz"],
					roll: ["../../node_modules/rollup"],
					"@p": ["./xx/qq.ts", "./xx/ff.ts"],
					"@q": ["./xx/ee.ts"],
					"#v": ["./xx/vv.abs"],
					"@v": ["./xx/vv.abs.ts"],
				},
			},
			fileNames: [path.resolve(__dirname, "demo.ts")],
		},
	})
	expect(handler).toBeTruthy()

	const resolve = (request: string) => handler!(request, path.resolve(__dirname, "demo.ts"))
	expect(resolve("~/hello")).toEqual(path.resolve(__dirname, "hello.ts"))
	expect(resolve("~/qqq/hello")).toEqual(path.resolve(path.join(__dirname, "qqq/hello.js")))
	expect(resolve("@xxx/abc/xxx")).toEqual(path.resolve(__dirname, "xyz/abc/xyz.ts"))
	expect(resolve("@xxx/fff")).toEqual(path.resolve(__dirname, "abc/fff.js"))
	expect(resolve("#m/abc")).toEqual(path.resolve(__dirname, "xyz/abc/xyz.ts"))
	expect(resolve("#m/fff")).toEqual(path.resolve(__dirname, "abc/fff.js"))
	const r = resolve("roll")
	if (r) expect(require.resolve(r)).toEqual(require.resolve("rollup"))
	expect(resolve("./abc/App")).toEqual(undefined)
	expect(resolve("rollup")).toEqual(undefined)
	expect(resolve("@p")).toEqual(path.resolve(__dirname, "xx/qq.ts"))
	expect(resolve("@q")).toEqual(path.resolve(__dirname, "xx/ee.ts"))
	expect(resolve("#v")).toEqual(path.resolve(__dirname, "xx/vv.abs.ts"))
	expect(resolve("@v")).toEqual(path.resolve(__dirname, "xx/vv.abs.ts"))
})

test("core module", async () => {
	let handler = createHandler({
		respectCoreModule: true,
		tsConfigPath: {
			compilerOptions: {
				pathsBasePath: path.resolve(__dirname),
				paths: {
					path: ["./xx/vv.abs.ts"],
				},
			},
			fileNames: [path.resolve(__dirname, "demo.ts")],
		},
	})

	expect(handler).toBeTruthy()

	let resolve = (request: string) => handler!(request, path.resolve(__dirname, "demo.ts"))
	expect(resolve("path")).toEqual(undefined)

	handler = createHandler({
		respectCoreModule: false,
		tsConfigPath: {
			compilerOptions: {
				pathsBasePath: path.resolve(__dirname),
				paths: {
					path: ["./xx/vv.abs.ts"],
				},
			},
			fileNames: [path.resolve(__dirname, "demo.ts")],
		},
	})

	expect(handler).toBeTruthy()

	resolve = (request: string) => handler!(request, path.resolve(__dirname, "demo.ts"))
	expect(resolve("path")).toEqual(path.resolve(__dirname, "xx/vv.abs.ts"))
})
