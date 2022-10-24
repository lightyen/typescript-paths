import type { Plugin } from "rollup"
import type { RegisterOptions } from "typescript-paths"
export declare type PluginOptions = Omit<RegisterOptions, "loggerID">
export default function tsConfigPaths({ tsConfigPath, respectCoreModule, logLevel, colors }?: PluginOptions): Plugin
