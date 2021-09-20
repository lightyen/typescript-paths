import ts from "typescript"
import Module from "module"
import path from "path"
import { getTsConfig, createMappings, resolveModuleName } from "./paths"
import { formatLog } from "./log"

interface Options {
	tsConfigPath?: string | string[]
	logLevel?: "warn" | "debug" | "none"
	respectCoreModule?: boolean
	colors?: boolean
	strict?: boolean
}

interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}

export function fromTS_NODE_PROJECT(): string | string[] | undefined {
	const env = process.env["TS_NODE_PROJECT"]
	if (env) {
		return env.split(path.delimiter).filter(Boolean)
	}
	return undefined
}

interface Service {
	compilerOptions: ts.CompilerOptions
	fileNames: string[]
	mappings: ReturnType<typeof createMappings>
	cache: Map<string, boolean>
}

export function createHandler({
	tsConfigPath = fromTS_NODE_PROJECT() || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	logLevel = "warn",
	colors = true,
	strict = false,
	falllback,
}: Options & OptionFallback = {}) {
	const services: Service[] = []
	if (typeof tsConfigPath === "string") {
		tsConfigPath = [tsConfigPath]
	}
	try {
		for (const cfg of tsConfigPath) {
			const { compilerOptions, fileNames, errors } = getTsConfig({ tsConfigPath: cfg, host: ts.sys, colors })
			for (const err of errors) {
				console.error(formatLog("error", err.messageText, colors))
			}
			services.push({
				compilerOptions,
				fileNames,
				mappings: createMappings({ logLevel, respectCoreModule, paths: compilerOptions.paths!, colors }),
				cache: new Map(),
			})
		}
	} catch (err) {
		console.error(formatLog("error", err, colors))
		return undefined
	}

	const host: ts.ModuleResolutionHost = {
		...ts.sys,
		fileExists(filename) {
			if (filename.endsWith(ts.Extension.Dts)) return false
			return ts.sys.fileExists(filename)
		},
	}

	return (request: string, importer: string) =>
		services.reduce<string | undefined>((result, srv) => {
			if (result) {
				return result
			}
			const { compilerOptions, cache, fileNames, mappings } = srv
			if (strict) {
				const exist = cache.get(importer)
				if (exist !== undefined) {
					cache.delete(request)
					cache.set(request, exist)
					if (!exist) return undefined
				} else if (fileNames.indexOf(importer) === -1) {
					if (cache.size === 1 << 8) cache.delete(cache.keys().next().value)
					cache.set(importer, false)
					return undefined
				}
			}
			return resolveModuleName({
				compilerOptions,
				host,
				importer,
				request,
				mappings,
				falllback,
			})
		}, undefined)
}

export function register({
	tsConfigPath = fromTS_NODE_PROJECT() || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	logLevel = "warn",
	colors = true,
	strict = false,
	falllback,
}: Options & OptionFallback = {}): () => void {
	const handler = createHandler({ tsConfigPath, respectCoreModule, logLevel, colors, strict, falllback })
	if (!handler) {
		return () => {}
	}

	const originalResolveFilename = Module["_resolveFilename"]

	Module["_resolveFilename"] = function (request: string, parent: Module, ...args: any[]) {
		const moduleName = handler(request, parent["filename"])
		if (moduleName) {
			if (logLevel === "debug") {
				console.log(formatLog("info", `${request} -> ${moduleName}`, colors))
			}
			return originalResolveFilename.apply(this, [moduleName, parent, ...args])
		}
		return originalResolveFilename.apply(this, arguments)
	}

	return () => {
		Module["_resolveFilename"] = originalResolveFilename
	}
}
