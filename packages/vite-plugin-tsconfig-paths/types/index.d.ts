import type { RegisterOptions } from "typescript-paths"
import type { Plugin } from "vite"
export declare type PluginOptions = Omit<RegisterOptions, "loggerID">
export declare function tsConfigPaths({ tsConfigPath, respectCoreModule, logLevel, colors }?: PluginOptions): Plugin
export default tsConfigPaths
