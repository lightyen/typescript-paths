import { createHandler, LogFunc, RegisterOptions } from "typescript-paths"
import type { Compiler } from "webpack"
export interface PluginOptions extends Omit<RegisterOptions, "loggerID"> {}
export declare class TsPathsResolvePlugin {
	handler: ReturnType<typeof createHandler>
	log: LogFunc
	constructor({ tsConfigPath, respectCoreModule, logLevel, colors }?: Partial<PluginOptions>)
	apply(compiler: Compiler): void
}
export default TsPathsResolvePlugin
