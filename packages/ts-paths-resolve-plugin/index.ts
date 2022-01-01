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
	context: {
		issuer: string
	}
}

const PLUGIN_NAME = "TsPathsResolvePlugin"

export interface PluginOptions extends Omit<RegisterOptions, "loggerID"> {}

export class TsPathsResolvePlugin {
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
	apply(compiler: Compiler) {
		compiler.resolverFactory.hooks.resolver.for("normal").tap(PLUGIN_NAME, resolver => {
			resolver.hooks.resolve.tapAsync(PLUGIN_NAME, (request, context, callback) => {
				const innerRequest = request.request || request.path
				if (!innerRequest || request.module === false) {
					return callback()
				}

				const importer = (request as Request).context.issuer
				if (!importer) {
					return callback()
				}

				const moduleName = this.handler?.(innerRequest, importer)
				if (!moduleName) {
					return callback()
				}

				this.log(LogLevel.Debug, `${innerRequest} -> ${moduleName}`)

				return resolver.doResolve(
					resolver.hooks.resolve,
					{ ...request, request: moduleName },
					"",
					context,
					callback,
				)
			})
		})
	}
}

export default TsPathsResolvePlugin
