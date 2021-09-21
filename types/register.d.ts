import { LogFunc, LogLevelString } from "./logger"
interface Options {
	tsConfigPath?: string | string[]
	respectCoreModule?: boolean
	strict?: boolean
	logLevel?: LogLevelString
	colors?: boolean
	loggerID?: string
}
interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}
export declare function fromTS_NODE_PROJECT(): string | string[] | undefined
interface HandlerOptions {
	tsConfigPath?: string | string[]
	respectCoreModule?: boolean
	strict?: boolean
	log?: LogFunc
}
export declare function createHandler({
	tsConfigPath,
	respectCoreModule,
	strict,
	log,
	falllback,
}?: HandlerOptions & OptionFallback): ((request: string, importer: string) => string | undefined) | undefined
export declare function register({
	tsConfigPath,
	respectCoreModule,
	strict,
	logLevel,
	colors,
	loggerID,
	falllback,
}?: Options & OptionFallback): () => void
export {}
