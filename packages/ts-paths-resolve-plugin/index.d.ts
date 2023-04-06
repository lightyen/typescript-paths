import type { Resolver } from "enhanced-resolve"
import { createHandler, LogFunc, RegisterOptions } from "typescript-paths"
import type { Compiler } from "webpack"
export interface PluginOptions extends Omit<RegisterOptions, "loggerID"> {}
export default class TsPathsResolvePlugin {
	handler: ReturnType<typeof createHandler>
	log: LogFunc
	constructor({ tsConfigPath, respectCoreModule, logLevel, colors }?: Partial<PluginOptions>)
	apply(c: Compiler): void
	setup(resolver: Resolver): void
	isRsolver(obj: any): obj is Resolver
}
