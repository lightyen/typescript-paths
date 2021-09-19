interface Options {
    tsConfigPath?: string;
    logLevel?: "warn" | "debug" | "none";
    respectCoreModule?: boolean;
}
export declare function register({ tsConfigPath, respectCoreModule, logLevel, }?: Options): () => void;
export {};
