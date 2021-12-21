import { TsConfigPayload } from "./paths"
import { LogFunc, LogLevelString } from "./logger"
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
export declare function fromTS_NODE_PROJECT(): string | string[] | undefined
export interface HandlerOptions {
	tsConfigPath?: Options["tsConfigPath"]
	respectCoreModule?: Options["respectCoreModule"]
	log?: LogFunc
}
export declare function createHandler({
	tsConfigPath,
	respectCoreModule,
	log,
	falllback,
}?: HandlerOptions & OptionFallback): ((request: string, importer: string) => string | undefined) | undefined
export declare function register({
	tsConfigPath,
	respectCoreModule,
	logLevel,
	colors,
	loggerID,
	falllback,
}?: Options & OptionFallback): () => void
