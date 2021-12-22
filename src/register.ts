import Module from "module"
import path from "path"
import ts from "typescript"
import { convertLogLevel, createLogger, LogFunc, LogLevel, LogLevelString } from "./logger"
import { createMappings, getTsConfig, resolveModuleName, TsConfigPayload } from "./paths"

export interface Options {
	tsConfigPath?: string | string[] | TsConfigPayload | TsConfigPayload[]
	respectCoreModule?: boolean
	logLevel?: LogLevelString
	colors?: boolean
	loggerID?: string
}

export interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}

export function fromTS_NODE_PROJECT(): string | string[] | undefined {
	const env = process.env["TS_NODE_PROJECT"]
	if (env) {
		const tsConfigPaths = env.split(path.delimiter).filter(Boolean)
		if (tsConfigPaths.length > 0) {
			return tsConfigPaths
		}
	}
	return undefined
}

interface Service {
	compilerOptions: ts.CompilerOptions
	fileNames: string[]
	mappings: ReturnType<typeof createMappings>
	cache: Map<string, boolean>
}

export interface HandlerOptions {
	tsConfigPath?: Options["tsConfigPath"]
	respectCoreModule?: Options["respectCoreModule"]
	log?: LogFunc
}

export function createHandler({
	tsConfigPath = fromTS_NODE_PROJECT() || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	log = createLogger(),
	falllback,
}: HandlerOptions & OptionFallback = {}) {
	const services: Service[] = []
	if (typeof tsConfigPath === "string") {
		tsConfigPath = [tsConfigPath]
	} else if (!(tsConfigPath instanceof Array)) {
		tsConfigPath = [tsConfigPath]
	}

	function addServices(config: TsConfigPayload) {
		const { compilerOptions, fileNames = [], references } = config
		services.push({
			compilerOptions,
			fileNames,
			mappings: createMappings({
				log,
				respectCoreModule,
				paths: compilerOptions.paths!,
			}),
			cache: new Map(),
		})
		if (references) {
			for (const config of references) {
				addServices(config)
			}
		}
	}

	for (const configPayloadOrPath of tsConfigPath) {
		if (typeof configPayloadOrPath === "string") log(LogLevel.Trace, `loading: ${configPayloadOrPath}`)
		const config =
			typeof configPayloadOrPath === "string"
				? getTsConfig({
						tsConfigPath: configPayloadOrPath,
						host: ts.sys,
						log,
				  })
				: configPayloadOrPath
		if (!config) return undefined
		addServices(config)
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
	logLevel = "info",
	colors = true,
	loggerID,
	falllback,
}: Options & OptionFallback = {}): () => void {
	const log = createLogger({ logLevel: convertLogLevel(logLevel), colors, ID: loggerID })
	const handler = createHandler({ tsConfigPath, respectCoreModule, log, falllback })
	if (!handler) {
		return () => {}
	}

	const originalResolveFilename = Module["_resolveFilename"]

	Module["_resolveFilename"] = function (request: string, parent: Module, ...args: any[]) {
		const moduleName = handler(request, parent.filename)
		if (moduleName) {
			log(LogLevel.Debug, `${request} -> ${moduleName}`)
			return originalResolveFilename.apply(this, [moduleName, parent, ...args])
		}
		return originalResolveFilename.apply(this, arguments)
	}

	return () => {
		Module["_resolveFilename"] = originalResolveFilename
	}
}
