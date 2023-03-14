import path from "path"
import ts from "typescript"
import { createLogger, LogFunc, LogLevel } from "./logger"
import { createMappings, getTsConfig, resolveModuleName, TsConfigPayload } from "./paths"

export interface OptionFallback {
	falllback?: (moduleName: string) => boolean
}

interface Service {
	compilerOptions: ts.CompilerOptions
	fileNames: string[]
	mappings: ReturnType<typeof createMappings>
	cache: Map<string, boolean>
}

export interface HandlerOptions {
	/** Specifies the path to tsconfig.json */
	tsConfigPath?: string | TsConfigPayload | Array<string | TsConfigPayload>
	/** The directory where the tsconfig is stored */
	searchPath?: string | string[]
	respectCoreModule?: boolean
	log?: LogFunc
}

export function fromTS_NODE_PROJECT() {
	const env = process.env["TS_NODE_PROJECT"]
	if (env) return env.split(path.delimiter).filter(Boolean)
	return undefined
}

export function createHandler({
	searchPath,
	tsConfigPath = fromTS_NODE_PROJECT(),
	respectCoreModule = true,
	log = createLogger(),
	falllback,
}: HandlerOptions & OptionFallback = {}) {
	if (!tsConfigPath) {
		if (searchPath && searchPath instanceof Array) {
			tsConfigPath = searchPath
				.map(p => ts.findConfigFile(p, ts.sys.fileExists))
				.filter((v: string | undefined): v is string => Boolean(v))
		} else {
			tsConfigPath = ts.findConfigFile(searchPath || ts.sys.getCurrentDirectory(), ts.sys.fileExists) || []
		}
	}

	const host: ts.ModuleResolutionHost = {
		...ts.sys,
		fileExists(filename) {
			if (filename.endsWith(ts.Extension.Dts)) return false
			return ts.sys.fileExists(filename)
		},
	}
	const services: Service[] = []
	const configs = spreadTsConfig(tsConfigPath)
	if (!configs) {
		// can't read tsconfig files
		return undefined
	}
	for (const config of configs) {
		addServices(config)
	}

	return (request: string, importer: string) =>
		services.reduce<string | undefined>((result, srv) => {
			if (result) {
				return result
			}
			const { compilerOptions, cache, fileNames, mappings } = srv
			const exist = cache.get(importer)
			if (exist !== undefined) {
				cache.delete(importer)
				cache.set(importer, exist)
				if (!exist) return undefined
			} else if (fileNames.indexOf(importer) === -1) {
				if (cache.size === 1 << 8) cache.delete(cache.keys().next().value)
				cache.set(importer, false)
				return undefined
			} else {
				if (cache.size === 1 << 8) cache.delete(cache.keys().next().value)
				cache.set(importer, true)
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

	function spreadTsConfig(
		tsConfigPath: string | TsConfigPayload | Array<string | TsConfigPayload>,
	): TsConfigPayload[] | undefined {
		if (typeof tsConfigPath === "string") {
			tsConfigPath = [tsConfigPath]
		} else if (!(tsConfigPath instanceof Array)) {
			tsConfigPath = [tsConfigPath]
		}

		const configs: TsConfigPayload[] = []
		for (const configPayloadOrPath of tsConfigPath) {
			if (typeof configPayloadOrPath === "string") {
				log(LogLevel.Trace, `loading: ${configPayloadOrPath}`)
			}
			const config =
				typeof configPayloadOrPath === "string"
					? getTsConfig({
							tsConfigPath: configPayloadOrPath,
							host: ts.sys,
							log,
					  })
					: configPayloadOrPath
			if (!config) {
				return undefined
			}
			configs.push(config)
		}

		// const resolvedConfigs = configs
		// 	.map(c => {
		// 		if (c.filePath && c.extends) {
		// 			let tsconfigPath = path.join(path.dirname(c.filePath), c.extends)
		// 			if (!tsconfigPath.endsWith(".json")) {
		// 				tsconfigPath = tsconfigPath + ".json"
		// 			}
		// 			const exts = spreadTsConfig(tsconfigPath)
		// 			if (exts) {
		// 				return [c, ...exts]
		// 			}
		// 		}
		// 		return c
		// 	})
		// 	.flat()
		// for (const v of resolvedConfigs) {
		// 	if (v == undefined) {
		// 		return undefined
		// 	}
		// }

		return configs
	}
}
