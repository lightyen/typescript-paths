import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "rollup"
import ts from "typescript"
import type { RegisterOptions } from "typescript-paths"
import { convertLogLevel, createHandler, createLogger, LogLevel } from "typescript-paths"

const PLUGIN_NAME = "tsconfig-paths"

export type PluginOptions = Omit<RegisterOptions, "loggerID">

export function tsConfigPaths({
	tsConfigPath,
	respectCoreModule,
	logLevel,
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
				falllback: moduleName => fs.existsSync(moduleName),
			})
			return
		},
		async resolveId(request, importer, options) {
			if (!importer || request.startsWith("\0")) {
				return null
			}

			const moduleName = handler?.(request, importer)
			if (!moduleName) {
				return this.resolve(request, importer, { skipSelf: true, ...options })
			}

			log(LogLevel.Debug, `${request} -> ${moduleName}`)
			if (!path.extname(moduleName)) {
				return this.resolve(moduleName, importer, { skipSelf: true, ...options })
			}

			return moduleName
		},
	}
}
