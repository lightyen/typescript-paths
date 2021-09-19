interface Options {
    tsConfigPath?: string;
    logLevel?: "warn" | "debug" | "none";
    respectCoreModule?: boolean;
    colors?: boolean;
}
export declare function register({ tsConfigPath, respectCoreModule, logLevel, colors, }?: Options): () => void;
export {};
