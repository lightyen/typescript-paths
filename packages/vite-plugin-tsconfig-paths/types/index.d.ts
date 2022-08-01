import type { RegisterOptions } from "typescript-paths"
import type { Plugin } from "vite"
export declare type PluginOptions = Omit<RegisterOptions, "loggerID">
export default function tsConfigPaths({ tsConfigPath, respectCoreModule, logLevel, colors }?: PluginOptions): Plugin
