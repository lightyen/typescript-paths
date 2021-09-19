import { createMappings, dtsExcludedHost, findMatch, getTsConfig, resolveModuleName, createHandler } from "../src"
import path from "path"

test("read config", async () => {
	const compilerOptions = getTsConfig({ tsConfigPath: path.resolve(__dirname, "bad.tsconfig.json") })
	expect(compilerOptions).toBeTruthy()
	expect(compilerOptions.baseUrl).toBeTruthy()
	expect(compilerOptions.paths).toBeTruthy()
	expect(!(compilerOptions.paths instanceof Array)).toBeTruthy()
})

test("path mappings", async () => {
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
		respectCoreModule: true,
		paths: {
			"~/**/*": ["./*"],
			"abc/*": ["*/xxx/*"],
			"kkk/**/*/def": ["cde/*/world", "world/*/cde"],
		},
	})
	expect(mappings).toHaveLength(0)
})

test("resolving paths", async () => {
	const handler = createHandler({ tsConfigPath: path.resolve(__dirname, "tsconfig.json") })
	expect(handler).toBeTruthy()

	const resolve = (request: string) => handler!(request, path.resolve(__dirname, "t0", "index.ts"))
	expect(resolve("~/hello")).toEqual(path.resolve(__dirname, "t0", "hello.ts"))
	expect(resolve("~/qqq/hello")).toEqual(require.resolve(path.join(__dirname, "t0", "qqq/hello.js")))
	expect(resolve("@xxx/abc/xxx")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolve("@xxx/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	expect(resolve("#m/abc")).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))
	expect(resolve("#m/fff")).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))
	expect(resolve("roll")).toEqual(require.resolve("rollup"))
	expect(resolve("./t0/abc/App")).toBeFalsy()
	expect(resolve("rollup")).toBeFalsy()
})
