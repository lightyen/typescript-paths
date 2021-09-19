import ts from "typescript"
import Module from "module"
import { getTsConfig, createMappings, resolveModuleName, dtsExcludedHost } from "./paths"
import { formatLog } from "./log"
import { Mapping } from "."

interface Options {
	tsConfigPath?: string
	logLevel?: "warn" | "debug" | "none"
	respectCoreModule?: boolean
	colors?: boolean
}

export function createHandler({
	tsConfigPath = process.env["TS_NODE_PROJECT"] || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	logLevel = "warn",
	colors = true,
}: Options = {}) {
	let compilerOptions: ts.CompilerOptions
	let mappings: Mapping[]
	try {
		compilerOptions = getTsConfig({ tsConfigPath, host: ts.sys, colors })
		mappings = createMappings({ logLevel, respectCoreModule, paths: compilerOptions.paths!, colors })
	} catch (err) {
		console.error(formatLog("error", err, colors))
		return undefined
	}

	return (request: string, importer: string) =>
		resolveModuleName({
			compilerOptions,
			host: dtsExcludedHost,
			importer,
			request,
			mappings,
		})
}

export function register({
	tsConfigPath = process.env["TS_NODE_PROJECT"] || ts.findConfigFile(".", ts.sys.fileExists) || "tsconfig.json",
	respectCoreModule = true,
	logLevel = "warn",
	colors = true,
}: Options = {}): () => void {
	const handler = createHandler({ tsConfigPath, respectCoreModule, logLevel, colors })
	if (!handler) {
		return () => {}
	}

	const originalResolveFilename = Module["_resolveFilename"]

	Module["_resolveFilename"] = function (request: string, parent: Module, ...args: any[]) {
		const moduleName = handler(request, parent["id"])
		if (moduleName) {
			if (logLevel === "debug") {
				console.log(formatLog("info", `${request} -> ${moduleName}`, colors))
			}
			return originalResolveFilename.apply(this, [moduleName, parent, ...args])
		}
		return originalResolveFilename.apply(this, arguments)
	}

	return () => {
		Module["_resolveFilename"] = originalResolveFilename
	}
}
