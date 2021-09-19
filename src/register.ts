import ts from "typescript"
import Module from "module"
import { getTsConfig, createMappings, resolveModuleName, dtsExcludedHost } from "./paths"
import { formatLog } from "./log"

interface Options {
	tsConfigPath?: string
	logLevel?: "warn" | "debug" | "none"
	respectCoreModule?: boolean
}

export function register({
	tsConfigPath = process.env["TS_NODE_PROJECT"] || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	logLevel = "warn",
}: Options = {}): () => void {
	let compilerOptions: ts.CompilerOptions
	try {
		compilerOptions = getTsConfig(tsConfigPath, ts.sys)
	} catch (err) {
		console.error(formatLog("error", err))
		return () => {}
	}

	const mappings = createMappings({ logLevel, respectCoreModule, paths: compilerOptions.paths! })

	const originalResolveFilename = Module["_resolveFilename"]

	Module["_resolveFilename"] = function (request: string, parent: Module, ...args: any[]) {
		const moduleName = resolveModuleName({
			compilerOptions,
			host: dtsExcludedHost,
			importer: parent["id"],
			request,
			mappings,
		})
		if (moduleName) {
			if (logLevel === "debug") {
				console.log(formatLog("info", `${request} -> ${moduleName}`))
			}
			return originalResolveFilename.apply(this, [moduleName, parent, ...args])
		}
		return originalResolveFilename.apply(this, arguments)
	}

	return () => {
		Module["_resolveFilename"] = originalResolveFilename
	}
}
