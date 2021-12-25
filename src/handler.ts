import path from "path"
import ts from "typescript"
import { createLogger, LogFunc, LogLevel } from "./logger"
import { createMappings, getTsConfig, resolveModuleName, TsConfigPayload } from "./paths"

export interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}

interface Service {
	compilerOptions: ts.CompilerOptions
	fileNames: string[]
	mappings: ReturnType<typeof createMappings>
	cache: Map<string, boolean>
}

export interface HandlerOptions {
	tsConfigPath?: string | TsConfigPayload | Array<string | TsConfigPayload>
	respectCoreModule?: boolean
	log?: LogFunc
}

export function fromTS_NODE_PROJECT() {
	const env = process.env["TS_NODE_PROJECT"]
	if (env) {
		const tsConfigPaths = env.split(path.delimiter).filter(Boolean)
		if (tsConfigPaths.length > 0) {
			return tsConfigPaths
		}
	}
	return undefined
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
		const { compilerOptions, fileNames, references } = config
		if (!compilerOptions.paths || compilerOptions.paths instanceof Array) return
		services.push({
			compilerOptions,
			fileNames,
			mappings: createMappings({
				log,
				respectCoreModule,
				paths: compilerOptions.paths,
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
