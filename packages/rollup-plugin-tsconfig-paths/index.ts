import type { Plugin } from "rollup"
import ts from "typescript"
import fs from "fs"
import type { RegisterOptions } from "typescript-paths"
import { convertLogLevel, createHandler, createLogger, LogLevel } from "typescript-paths"

const PLUGIN_NAME = "tsconfig-paths"

export type PluginOptions = Omit<RegisterOptions, "loggerID">

export function tsConfigPaths({
	tsConfigPath,
	respectCoreModule,
	logLevel = "info",
	colors = true,
}: PluginOptions = {}): Plugin {
	let log: ReturnType<typeof createLogger>
	let handler: ReturnType<typeof createHandler>
	return {
		name: PLUGIN_NAME,
		buildStart() {
			log = createLogger({ logLevel: convertLogLevel(logLevel), colors, ID: PLUGIN_NAME })
			log(LogLevel.Debug, `typescript version: ${ts.version}`)
			handler = createHandler({
				log,
				tsConfigPath,
				respectCoreModule,
				falllback: moduleName => (fs.existsSync(moduleName) ? moduleName : undefined),
			})
			return
		},
		async resolveId(request: string, importer?: string) {
			if (!importer || request.startsWith("\0")) {
				return null
			}

			const moduleName = handler?.(request, importer)
			if (!moduleName) {
				return this.resolve(request, importer, { skipSelf: true })
			}

			log(LogLevel.Debug, `${request} -> ${moduleName}`)

			return moduleName
		},
	}
}

export default tsConfigPaths
