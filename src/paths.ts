import path from "path"
import ts from "typescript"
import { formatLog } from "./log"

export const coreModules = {
	assert: "provides a set of assertion functions useful for testing",
	buffer: "provides the ability to handle buffers containing binary data",
	child_process: "provides the ability to spawn child processes",
	console: "provides a simple debugging console",
	cluster: "allows to split a Node.js process into multiple workers to take advantage of multi-core systems",
	crypto: "provides cryptographic functionality",
	dgram: "provides an implementation of UDP Datagram sockets",
	dns: "provides name resolution and DNS lookups",
	events: "provides an API for managing events",
	fs: "provides an API for interacting with the file system",
	http: "provides an HTTP client/server implementation",
	http2: "provides an HTTP/2 client/server implementation",
	https: "provides an HTTPS client/server implementation",
	net: "provides an asynchronous network API",
	os: "provides operating system-related utility methods and properties",
	path: "provides utilities for working with file and directory paths",
	perf_hooks: "to enable the collection of performance metrics",
	process: "provides information about, and control over, the current Node.js process",
	querystring: "provides utilities for parsing and formatting URL query strings",
	readline: "provides an interface for reading data from a Readable stream",
	repl: "provides a Read-Eval-Print-Loop (REPL) implementation that is available both as a standalone program or includible in other applications",
	stream: "an abstract interface for working with streaming data",
	string_decoder: "provides an API for decoding Buffer objects into strings",
	timers: "provide functions to schedule functions to be called at some future period of time",
	tls: "provides an implementation of the Transport Layer Security (TLS) and Secure Socket Layer (SSL) protocols",
	tty: "provides functionality used to perform I/O operations in a text terminal",
	url: "provides utilities for URL resolution and parsing",
	util: "supports the needs of Node.js internal APIs, useful for application and module developers as well",
	v8: "exposes APIs that are specific to the version of V8 built into the Node.js binary",
	vm: "enables compiling and running code within V8 Virtual Machine contexts",
	wasi: "provides an implementation of the WebAssembly System Interface specification",
	worker: "enables the use of threads that execute JavaScript in parallel",
	zlib: "provides compression functionality",
}

export interface Mapping {
	pattern: string
	prefix: string
	suffix: string
	wildcard: boolean
	targets: string[]
}

export function getTsConfig({
	tsConfigPath,
	host = ts.sys,
	colors = false,
}: {
	tsConfigPath: string
	host?: ts.ParseConfigHost
	colors?: boolean
}) {
	const { error, config } = ts.readConfigFile(tsConfigPath, host.readFile)
	if (error) {
		throw new Error(formatLog("error", error.messageText, colors))
	}
	let { options: compilerOptions } = ts.parseJsonConfigFileContent(config, host, path.dirname(tsConfigPath))
	if (!compilerOptions) {
		throw new Error(formatLog("error", "'compilerOptions' is gone.", colors))
	}
	if (compilerOptions.baseUrl == undefined) {
		compilerOptions.baseUrl = path.dirname(tsConfigPath)
	}
	if (!compilerOptions.paths || compilerOptions.paths instanceof Array) {
		compilerOptions.paths = {}
	}
	return compilerOptions
}

export function createMappings({
	paths,
	respectCoreModule = true,
	logLevel = "none",
	colors = false,
}: {
	paths: ts.MapLike<string[]>
	respectCoreModule?: boolean
	logLevel?: "warn" | "debug" | "none"
	colors?: boolean
}): Mapping[] {
	const countWildcard = (value: string) => value.match(/\*/g)?.length ?? 0
	const valid = (value: string) => /(\*|\/\*|\/\*\/)/.test(value)

	const mappings: Mapping[] = []
	for (const pattern of Object.keys(paths)) {
		if (countWildcard(pattern) > 1) {
			logLevel != "none" &&
				console.warn(formatLog("warn", `Pattern '${pattern}' can have at most one '*' character.`, colors))
			continue
		}
		const wildcard = pattern.indexOf("*")
		if (wildcard !== -1 && !valid(pattern)) {
			logLevel != "none" && console.warn(formatLog("warn", `path pattern '${pattern}' is not valid.`, colors))
			continue
		}
		if (respectCoreModule) {
			for (const key in coreModules) {
				if (pattern.startsWith(key)) {
					if (logLevel != "none") {
						console.warn(formatLog("warn", `path pattern core modules like '${pattern}' is ignored.`, colors))
						console.log(formatLog("info", `(${key}) ${coreModules[key]}`, colors))
					}
					continue
				}
			}
		}
		const targets = paths[pattern].filter(target => {
			if (countWildcard(target) > 1) {
				logLevel != "none" &&
					console.warn(
						formatLog(
							"warn",
							`Substitution '${target}' in pattern '${pattern}' can have at most one '*' character.`, colors,
						),
					)
				return false
			}
			const wildcard = target.indexOf("*")
			if (wildcard !== -1 && !valid(target)) {
				logLevel != "none" && console.warn(formatLog("warn", `target pattern '${target}' is not valid`, colors))
				return false
			}
			if (target.indexOf("@types") !== -1 || target.endsWith(".d.ts")) {
				logLevel != "none" && console.warn(formatLog("warn", `type defined ${target} is ignored.`, colors))
				return false
			}
			return true
		})
		if (targets.length == 0) {
			continue
		}
		if (pattern === "*") {
			mappings.push({ wildcard: true, pattern, prefix: "", suffix: "", targets })
			continue
		}
		mappings.push({
			wildcard: wildcard !== -1,
			pattern,
			prefix: pattern.substr(0, wildcard),
			suffix: pattern.substr(wildcard + 1),
			targets,
		})
	}

	if (logLevel === "debug") {
		for (const mapping of mappings) {
			console.log(formatLog("info", `pattern: '${mapping.pattern}' targets: '${mapping.targets}'`, colors))
		}
	}
	return mappings
}

export function isPatternMatch(prefix: string, suffix: string, candidate: string): boolean {
	return (
		candidate.length >= prefix.length + suffix.length && candidate.startsWith(prefix) && candidate.endsWith(suffix)
	)
}

export function findMatch(moduleName: string, mappings: Mapping[]): Mapping | undefined {
	let longestMatchedPrefixLength = 0
	let matched: Mapping | undefined
	for (const mapping of mappings) {
		const { wildcard, prefix, suffix, pattern } = mapping
		if (wildcard && isPatternMatch(prefix, suffix, moduleName)) {
			if (longestMatchedPrefixLength < prefix.length) {
				longestMatchedPrefixLength = prefix.length
				matched = mapping
			}
		} else if (moduleName === pattern) {
			matched = mapping
			break
		}
	}
	return matched
}

export function containNodeModules(str: string) {
	return str.indexOf(path.sep + "node_modules" + path.sep) !== -1
}

export const dtsExcludedHost: ts.ModuleResolutionHost = {
	...ts.sys,
	fileExists(filename) {
		if (filename.endsWith(ts.Extension.Dts)) return false
		return ts.sys.fileExists(filename)
	},
}

export function resolveModuleName({
	mappings,
	request,
	importer,
	compilerOptions,
	host,
	falllback,
}: {
	compilerOptions: ts.CompilerOptions
	mappings: Mapping[]
	request: string
	importer: string
	host: ts.ModuleResolutionHost
	falllback?: (moduleName: string) => string | undefined
}): string | undefined {
	const matched = findMatch(request, mappings)
	if (!matched) {
		return undefined
	}

	const matchedWildcard = request.slice(matched.prefix.length, request.length - matched.suffix.length)

	for (const target of matched.targets) {
		const updated = matched.wildcard ? target.replace("*", matchedWildcard) : target
		const moduleName = path.resolve(compilerOptions.baseUrl!, updated)
		const result = ts.resolveModuleName(moduleName, importer, compilerOptions, host)
		if (result?.resolvedModule) {
			return path.normalize(result.resolvedModule.resolvedFileName)
		}
		if (falllback?.(moduleName)) {
			return moduleName
		}
	}

	return undefined
}
