import path from "path"
import { createHandler, createMappings, findMatch, getTsConfig } from "../src"
import { createLogger, LogLevel } from "../src/logger"

const log = createLogger({ logLevel: LogLevel.None })

test("read bad config", async () => {
	const config = getTsConfig({ log, tsConfigPath: path.resolve(__dirname, "bad.tsconfig.json") })
	expect(config).toBeTruthy()
	const compilerOptions = config!.compilerOptions
	expect(compilerOptions).toBeTruthy()
	expect(compilerOptions!.baseUrl).toBeFalsy()
	expect(compilerOptions!.paths).toBeTruthy()
	expect(!(compilerOptions.paths instanceof Array)).toBeTruthy()
})

test("build mappings", async () => {
	let mappings = createMappings({
		log,
		paths: {
			"~/*": ["*"],
			"abc/*": ["xxx/*"],
			"abc/hello/*": ["cde/hello/*", "cde/hello2/*"],
			"kkk/*": ["xxx/*"],
			"kkk/*/def": ["cde/*/world", "world/*/cde"],
		},
	})
	expect(mappings).toHaveLength(5)

	// 1. not match
	let request = "abc"
	let match = findMatch(request, mappings)
	expect(match).toBeFalsy()

	// 2. match the longest prefix
	request = "abc/hello/def"
	match = findMatch(request, mappings)
	expect(match).toBeTruthy()
	if (match) {
		expect(match?.pattern).toEqual("abc/hello/*")
	}

	// 2. match the first pattern
	request = "kkk/hello/def"
	match = findMatch(request, mappings)
	expect(match).toBeTruthy()
	if (match) {
		expect(match?.pattern).toEqual("kkk/*")
	}

	// 3. match the first pattern
	mappings = createMappings({
		log,
		paths: {
			"~/*": ["./*"],
			"abc/*": ["xxx/*"],
			"abc/hello/*": ["cde/hello/*", "cde/hello2/*"],
			"kkk/*/def": ["cde/*/world", "world/*/cde"],
			"kkk/*": ["xxx/*"],
		},
	})
	match = findMatch(request, mappings)
	expect(match).toBeTruthy()
	if (match) {
		expect(match?.pattern).toEqual("kkk/*/def")
	}

	// 2. invalid pattern
	mappings = createMappings({
		log,
		respectCoreModule: true,
		paths: {
			"~/**/*": ["./*"],
			"abc/*": ["*/xxx/*"],
			"kkk/**/*/def": ["cde/*/world", "world/*/cde"],
		},
	})
	expect(mappings).toHaveLength(0)
})

test("support multiple tsconfig", async () => {
	process.env["TS_NODE_PROJECT"] = [
		path.resolve(__dirname, "t0/tsconfig.json"),
		path.resolve(__dirname, "t1/tsconfig.json"),
	].join(path.delimiter)
	const handler = createHandler({})
	expect(handler).toBeTruthy()

	const resolveT0 = (request: string) => handler!(request, path.resolve(__dirname, "t0", "demo.ts"))
	const resolveT1 = (request: string) => handler!(request, path.resolve(__dirname, "t1", "index.ts"))

	expect(resolveT0("~/hello")).toEqual(path.resolve(__dirname, "t0", "hello.ts"))
	expect(resolveT0("~/qqq/hello")).toEqual(require.resolve(path.join(__dirname, "t0", "qqq/hello.js")))
	expect(resolveT0("@xxx/abc/xxx")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolveT0("@xxx/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	expect(resolveT0("#m/abc")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolveT0("#m/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	expect(resolveT0("roll")).toEqual(require.resolve("rollup"))
	expect(resolveT0("./t0/abc/App")).toBeFalsy()
	expect(resolveT0("rollup")).toBeFalsy()

	expect(resolveT1("~/hello")).toEqual(undefined)
	expect(resolveT1("~/qqq/hello")).toEqual(undefined)
	expect(resolveT1("@xxx/abc/xxx")).toEqual(undefined)
	expect(resolveT1("@xxx/fff")).toEqual(undefined)
	expect(resolveT1("#m/abc")).toEqual(undefined)
	expect(resolveT1("#m/fff")).toEqual(undefined)
	expect(resolveT1("roll")).toEqual(undefined)

	expect(resolveT1("~hu/hello")).toEqual(path.resolve(__dirname, "t1", "he/hello.ts"))
	expect(resolveT0("~hu/hello")).toEqual(undefined)
})
