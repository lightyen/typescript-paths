import ts from "typescript";
export declare const coreModules: {
    assert: string;
    buffer: string;
    child_process: string;
    console: string;
    cluster: string;
    crypto: string;
    dgram: string;
    dns: string;
    events: string;
    fs: string;
    http: string;
    http2: string;
    https: string;
    net: string;
    os: string;
    path: string;
    perf_hooks: string;
    process: string;
    querystring: string;
    readline: string;
    repl: string;
    stream: string;
    string_decoder: string;
    timers: string;
    tls: string;
    tty: string;
    url: string;
    util: string;
    v8: string;
    vm: string;
    wasi: string;
    worker: string;
    zlib: string;
};
interface Mapping {
    pattern: string;
    prefix: string;
    suffix: string;
    wildcard: boolean;
    targets: string[];
}
export declare function getTsConfig({ tsConfigPath, host, colors, }: {
    tsConfigPath: string;
    host?: ts.ParseConfigHost;
    colors?: boolean;
}): {
    compilerOptions: ts.CompilerOptions;
    fileNames: string[];
    errors: ts.Diagnostic[];
};
export declare function createMappings({ paths, respectCoreModule, logLevel, colors, }: {
    paths: ts.MapLike<string[]>;
    respectCoreModule?: boolean;
    logLevel?: "warn" | "debug" | "none";
    colors?: boolean;
}): Mapping[];
export declare function isPatternMatch(prefix: string, suffix: string, candidate: string): boolean;
export declare function findMatch(moduleName: string, mappings: Mapping[]): Mapping | undefined;
export declare function containNodeModules(str: string): boolean;
export declare function resolveModuleName({ mappings, request, importer, compilerOptions, host, falllback, }: {
    compilerOptions: ts.CompilerOptions;
    mappings: Mapping[];
    request: string;
    importer: string;
    host: ts.ModuleResolutionHost;
    falllback?: (moduleName: string) => string | undefined;
}): string | undefined;
export {};
