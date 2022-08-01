import type { Resolver } from "enhanced-resolve"
import fs from "fs"
import ts from "typescript"
import { convertLogLevel, createHandler, createLogger, LogFunc, LogLevel, RegisterOptions } from "typescript-paths"
import type { Compiler } from "webpack"

interface Request {
	path: string | false
	request: string
	query: string
	fragment: string
	directory: boolean
	module: boolean
	file: boolean
	descriptionFilePath: string
	descriptionFileRoot: string
	descriptionFileData: unknown
	relativePath: string
	context?: {
		issuer?: string
	}
}

const PLUGIN_NAME = "TsPathsResolvePlugin"

export interface PluginOptions extends Omit<RegisterOptions, "loggerID"> {}

export default class TsPathsResolvePlugin {
	handler: ReturnType<typeof createHandler>
	log: LogFunc
	constructor({ tsConfigPath, respectCoreModule, logLevel, colors = true }: Partial<PluginOptions> = {}) {
		this.log = createLogger({ logLevel: convertLogLevel(logLevel), colors, ID: PLUGIN_NAME })
		this.log(LogLevel.Debug, `typescript version: ${ts.version}`)
		this.handler = createHandler({
			tsConfigPath,
			log: this.log,
			respectCoreModule,
			falllback: moduleName => fs.existsSync(moduleName),
		})
	}
	apply(c: Compiler | Resolver) {
		if (this.isRsolver(c)) {
			this.setup(c)
			return
		}
		c.resolverFactory.hooks.resolver.for("normal").tap(PLUGIN_NAME, this.setup.bind(this))
	}
	setup(resolver: Resolver) {
		const target = resolver.ensureHook("resolve")
		const hook = resolver.getHook("described-resolve")
		hook.tapAsync(PLUGIN_NAME, (request, resolveContext, callback) => {
			const innerRequest = request.request || request.path
			if (!innerRequest || !request.module) return callback()
			const importer = (request as Request).context?.issuer
			if (!importer) return callback()
			const moduleName = this.handler?.(innerRequest, importer)
			if (!moduleName) return callback()
			this.log(LogLevel.Debug, `${innerRequest} -> ${moduleName}`)
			return resolver.doResolve(target, { ...request, request: moduleName }, "", resolveContext, callback)
		})
	}
	isRsolver(obj: any): obj is Resolver {
		return typeof obj?.doResolve === "function"
	}
}
