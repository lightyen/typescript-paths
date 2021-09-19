import { createMappings, dtsExcludedHost, findMatch, getTsConfig, resolveModuleName } from "../src/paths"
import ts from "typescript"
import path from "path"

test("read config", async () => {
	const compilerOptions = getTsConfig(path.resolve(__dirname, "bad.tsconfig.json"), ts.sys)
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
	let compilerOptions = getTsConfig(path.resolve(__dirname, "tsconfig.json"), ts.sys)
	let mappings = createMappings({ paths: compilerOptions.paths! })
	const opts: Parameters<typeof resolveModuleName>[0] = {
		mappings,
		compilerOptions,
		host: dtsExcludedHost,
		importer: path.resolve(__dirname, "t0", "index.ts"),
		request: "",
	}

	opts.request = "~/hello"
	expect(resolveModuleName(opts)).toEqual(path.resolve(__dirname, "t0", "hello.ts"))

	opts.request = "~/qqq/hello"
	expect(resolveModuleName(opts)).toEqual(require.resolve(path.join(__dirname, "t0", "qqq/hello.js")))

	opts.request = "@xxx/abc/xxx"
	expect(resolveModuleName(opts)).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))

	opts.request = "@xxx/fff"
	expect(resolveModuleName(opts)).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))

	opts.request = "#m/abc"
	expect(resolveModuleName(opts)).toEqual(path.resolve(__dirname, "t0", "xyz/abc/xyz.ts"))

	opts.request = "#m/fff"
	expect(resolveModuleName(opts)).toEqual(path.resolve(__dirname, "t0", "abc/fff.js"))

	opts.request = "roll"
	expect(resolveModuleName(opts)).toEqual(require.resolve("rollup"))

	opts.request = "./t0/abc/App"
	expect(resolveModuleName(opts)).toBeFalsy()

	opts.request = "rollup"
	expect(resolveModuleName(opts)).toBeFalsy()
})
