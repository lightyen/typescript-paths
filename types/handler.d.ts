import { LogFunc } from "./logger"
import { TsConfigPayload } from "./paths"
export interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}
export interface HandlerOptions {
	tsConfigPath?: string | TsConfigPayload | Array<string | TsConfigPayload>
	respectCoreModule?: boolean
	log?: LogFunc
}
export declare function createHandler({
	tsConfigPath,
	respectCoreModule,
	log,
	falllback,
}?: HandlerOptions & OptionFallback): ((request: string, importer: string) => string | undefined) | undefined
