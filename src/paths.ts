import fs from "fs"
import path from "path"
import ts from "typescript"
import { createLogger, LogFunc, LogLevel } from "./logger"

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

export interface TsConfigPayload {
	compilerOptions: ts.CompilerOptions
	fileNames?: string[]
	references?: TsConfigPayload[]
}

export function getTsConfig({
	tsConfigPath,
	log = createLogger(),
	host = ts.sys,
}: {
	tsConfigPath: string
	log?: LogFunc
	host?: ts.ParseConfigHost
}): undefined | TsConfigPayload {
	const { error, config } = ts.readConfigFile(tsConfigPath, host.readFile)
	if (error) {
		let hasError = false
		switch (error.category) {
			case ts.DiagnosticCategory.Error:
				log(LogLevel.Error, error.messageText)
				hasError = true
				break
			case ts.DiagnosticCategory.Warning:
				log(LogLevel.Warning, error.messageText)
				break
			case ts.DiagnosticCategory.Suggestion:
				log(LogLevel.Info, error.messageText)
				break
			case ts.DiagnosticCategory.Message:
				log(LogLevel.Info, error.messageText)
				break
		}
		if (hasError) return undefined
	}

	let {
		options: compilerOptions,
		errors,
		fileNames,
		projectReferences,
	} = ts.parseJsonConfigFileContent(config, host, path.resolve(path.dirname(tsConfigPath)))

	if (errors.length > 0) {
		let hasError = false
		for (const error of errors) {
			switch (error.category) {
				case ts.DiagnosticCategory.Error:
					log(LogLevel.Error, error.messageText)
					hasError = true
					break
				case ts.DiagnosticCategory.Warning:
					log(LogLevel.Warning, error.messageText)
					break
				case ts.DiagnosticCategory.Suggestion:
					log(LogLevel.Info, error.messageText)
					break
				case ts.DiagnosticCategory.Message:
					log(LogLevel.Info, error.messageText)
					break
			}
		}
		if (hasError) return undefined
	}

	const ret: TsConfigPayload = { compilerOptions, fileNames: fileNames.map(path.normalize) }

	if (projectReferences) {
		ret.references = []
		for (const r of projectReferences) {
			let tsConfigPath = r.path
			if (!path.isAbsolute(tsConfigPath)) {
				const base = compilerOptions.pathsBasePath as string
				tsConfigPath = path.resolve(base, tsConfigPath)
			}

			try {
				const stat = fs.lstatSync(tsConfigPath)
				if (stat.isDirectory()) {
					tsConfigPath = path.join(tsConfigPath, "tsconfig.json")
				}
			} catch (err) {
				const error = err as Error
				log(LogLevel.Error, error.message)
				return undefined
			}

			const cfg = getTsConfig({ tsConfigPath, log, host })
			if (cfg) ret.references.push(cfg)
		}
	}

	return ret
}

export function createMappings({
	paths,
	log = createLogger(),
	respectCoreModule = true,
}: {
	paths: ts.MapLike<string[]>
	log?: LogFunc
	respectCoreModule?: boolean
}): Mapping[] {
	const countWildcard = (value: string) => value.match(/\*/g)?.length ?? 0
	const valid = (value: string) => /(\*|\/\*|\/\*\/)/.test(value)

	const mappings: Mapping[] = []
	for (const pattern of Object.keys(paths)) {
		if (countWildcard(pattern) > 1) {
			log(LogLevel.Warning, `Pattern '${pattern}' can have at most one '*' character.`)
			continue
		}
		const wildcard = pattern.indexOf("*")
		if (wildcard !== -1 && !valid(pattern)) {
			log(LogLevel.Warning, `path pattern '${pattern}' is not valid.`)
			continue
		}
		if (respectCoreModule) {
			for (const key in coreModules) {
				if (pattern.startsWith(key)) {
					log(LogLevel.Warning, `path pattern core modules like '${pattern}' is ignored.`)
					log(LogLevel.Info, `(${key}) ${coreModules[key]}`)
					continue
				}
			}
		}
		const targets = paths[pattern].filter(target => {
			if (countWildcard(target) > 1) {
				log(
					LogLevel.Warning,
					`Substitution '${target}' in pattern '${pattern}' can have at most one '*' character.`,
				)
				return false
			}
			const wildcard = target.indexOf("*")
			if (wildcard !== -1 && !valid(target)) {
				log(LogLevel.Warning, `target pattern '${target}' is not valid`)
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

	for (const mapping of mappings) {
		log(LogLevel.Debug, `pattern: '${mapping.pattern}' targets: '${mapping.targets}'`)
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
		const base = (compilerOptions.baseUrl ?? compilerOptions.pathsBasePath) as string
		const moduleName = path.resolve(base, updated)
		const ext = path.extname(moduleName)
		switch (ext) {
			case ".ts":
			case ".tsx":
			case ".json":
			case ".js":
			case ".jsx":
				return moduleName
		}
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
