interface Options {
	tsConfigPath?: string | string[]
	logLevel?: "warn" | "debug" | "none"
	respectCoreModule?: boolean
	colors?: boolean
}
interface OptionFallback {
	falllback?: (moduleName: string) => string | undefined
}
export declare function fromTS_NODE_PROJECT(): string | string[] | undefined
export declare function createHandler({
	tsConfigPath,
	respectCoreModule,
	logLevel,
	colors,
	falllback,
}?: Options & OptionFallback): ((request: string, importer: string) => string | undefined) | undefined
export declare function register({
	tsConfigPath,
	respectCoreModule,
	logLevel,
	colors,
	falllback,
}?: Options & OptionFallback): () => void
export {}
