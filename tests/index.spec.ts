import path from "path"
import { createHandler, createMappings, findMatch, fromTS_NODE_PROJECT, getTsConfig } from "../src"
import { createLogger, LogLevel } from "../src/logger"

test("read config", async () => {
	const config = getTsConfig({
		tsConfigPath: path.resolve(__dirname, "tsconfig.json"),
	})
	expect(config).toBeTruthy()
	if (!config) return
	expect(config.compilerOptions).toBeTruthy()
	expect(config.compilerOptions.baseUrl).toBeFalsy()
	expect(config.compilerOptions.paths).toBeFalsy()
})

test("read bad config", async () => {
	const config = getTsConfig({
		log: createLogger({ logLevel: LogLevel.None }),
		tsConfigPath: path.resolve(__dirname, "bad.tsconfig.json"),
	})
	expect(config).toBeTruthy()
	if (!config) return
	expect(config.compilerOptions).toBeTruthy()
	expect(config.compilerOptions.baseUrl).toBeFalsy()
	expect(config.compilerOptions.paths).toBeFalsy()
})

test("read bad config 2", async () => {
	const log = createLogger({ logLevel: LogLevel.None })
	let config = getTsConfig({
		log,
		tsConfigPath: path.resolve(__dirname, "bad2.tsconfig.json"),
	})
	expect(config).toBeFalsy()
	config = getTsConfig({ log, tsConfigPath: path.resolve(__dirname, "config.json") })
	expect(config).toBeFalsy()
})

test("read bad config 3", async () => {
	const log = createLogger({ logLevel: LogLevel.None })
	const handler = createHandler({
		log,
		tsConfigPath: path.resolve(__dirname, "bad3.tsconfig.json"),
	})
	expect(handler).toBeTruthy()
})

test("build mappings", async () => {
	let mappings = createMappings({
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
		log: createLogger({ logLevel: LogLevel.None }),
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
	const handler = createHandler({ searchPath: [path.resolve(__dirname, "t0"), path.resolve(__dirname, "t1")] })
	expect(handler).toBeTruthy()

	const resolveT0 = (request: string) => handler!(request, path.resolve(__dirname, "t0", "demo.ts"))
	const resolveT1 = (request: string) => handler!(request, path.resolve(__dirname, "t1", "index.ts"))

	expect(resolveT0("~/hello")).toEqual(path.resolve(__dirname, "t0", "hello.ts"))
	expect(resolveT0("~/qqq/hello")).toEqual(path.resolve(path.join(__dirname, "t0", "qqq/hello.js")))
	expect(resolveT0("@xxx/abc/xxx")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolveT0("@xxx/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	expect(resolveT0("#m/abc")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolveT0("#m/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	const r = resolveT0("roll")
	if (r) expect(require.resolve(r)).toEqual(require.resolve("rollup"))
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

test("fromTS_NODE_PROJECT", () => {
	process.env.TS_NODE_PROJECT = ""
	expect(fromTS_NODE_PROJECT()).toEqual(undefined)
	process.env.TS_NODE_PROJECT = "common/tsconfig.json"
	expect(fromTS_NODE_PROJECT()).toEqual(["common/tsconfig.json"])
	process.env.TS_NODE_PROJECT = ""
})

test("none", async () => {
	expect(createHandler()).toBeTruthy()
})

test("invalid", async () => {
	expect(createHandler({ searchPath: path.join(__dirname, "undefined") })).toBeTruthy()
})
