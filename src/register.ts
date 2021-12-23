import Module from "module"
import { createHandler, OptionFallback } from "./handler"
import { convertLogLevel, createLogger, LogLevel, LogLevelString } from "./logger"
import { TsConfigPayload } from "./paths"

export interface RegisterOptions {
	tsConfigPath?: string | TsConfigPayload | Array<string | TsConfigPayload>
	respectCoreModule?: boolean
	logLevel?: LogLevelString
	colors?: boolean
	loggerID?: string
}

export function register({
	tsConfigPath,
	respectCoreModule,
	logLevel = "info",
	colors,
	loggerID,
	falllback,
}: RegisterOptions & OptionFallback = {}): () => void {
	const log = createLogger({ logLevel: convertLogLevel(logLevel), colors, ID: loggerID })
	const handler = createHandler({ tsConfigPath, respectCoreModule, log, falllback })
	if (!handler) {
		return () => {}
	}

	const originalResolveFilename = Module["_resolveFilename"]

	Module["_resolveFilename"] = function (request: string, parent?: Module, ...args: any[]) {
		if (!parent) return originalResolveFilename.apply(this, arguments)

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
