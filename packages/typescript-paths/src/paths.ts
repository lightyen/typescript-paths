import fs from "fs"
import { builtinModules } from "module"
import path from "path"
import ts from "typescript"
import { createLogger, LogFunc, LogLevel } from "./logger"

export interface Mapping {
	pattern: string
	prefix: string
	suffix: string
	wildcard: boolean
	targets: string[]
}

export interface TsConfigPayload {
	compilerOptions: ts.CompilerOptions
	fileNames: string[]
	references?: TsConfigPayload[]
}

export function getTsConfig({
	tsConfigPath,
	log = createLogger(),
	host = ts.sys,
}: {
	tsConfigPath: string
	log?: LogFunc
	host?: ts.ParseConfigHost
}): undefined | TsConfigPayload {
	const { error, config } = ts.readConfigFile(tsConfigPath, host.readFile)
	if (error) {
		let hasError = false
		switch (error.category) {
			case ts.DiagnosticCategory.Error:
				log(LogLevel.Error, error.messageText)
				hasError = true
				break
		}
		if (hasError) return undefined
	}

	let {
		options: compilerOptions,
		errors,
		fileNames,
		projectReferences,
	} = ts.parseJsonConfigFileContent(config, host, path.resolve(path.dirname(tsConfigPath)))

	if (errors.length > 0) {
		let hasError = false
		for (const error of errors) {
			switch (error.category) {
				case ts.DiagnosticCategory.Error:
					log(LogLevel.Error, error.messageText)
					hasError = true
					break
			}
		}
		if (hasError) return undefined
	}

	const ret: TsConfigPayload = { compilerOptions, fileNames: fileNames.map(path.normalize) }

	if (projectReferences) {
		ret.references = []
		for (const r of projectReferences) {
			let tsConfigPath = r.path
			try {
				const stat = fs.lstatSync(tsConfigPath)
				if (stat.isDirectory()) {
					tsConfigPath = path.join(tsConfigPath, "tsconfig.json")
				}
			} catch (err) {
				const error = err as Error
				log(LogLevel.Error, error.message)
				return undefined
			}

			const cfg = getTsConfig({ tsConfigPath, log, host })
			if (cfg) ret.references.push(cfg)
		}
	}

	return ret
}

export function createMappings({
	paths,
	log = createLogger(),
	respectCoreModule = true,
}: {
	paths: ts.MapLike<string[]>
	log?: LogFunc
	respectCoreModule?: boolean
}): Mapping[] {
	const countWildcard = (value: string) => value.match(/\*/g)?.length ?? 0

	const mappings: Mapping[] = []
	for (const pattern of Object.keys(paths)) {
		if (countWildcard(pattern) > 1) {
			log(LogLevel.Warning, `Pattern '${pattern}' can have at most one '*' character.`)
			continue
		}
		const wildcard = pattern.indexOf("*")
		if (respectCoreModule) {
			let skip = false
			for (const key of builtinModules) {
				if (pattern === key || pattern.startsWith(key + "/")) {
					log(LogLevel.Warning, `path pattern '${pattern}' is ignored.`)
					log(LogLevel.Info, `respect core module '${key}'.`)
					skip = true
				}
			}
			if (skip) continue
		}
		const targets = paths[pattern].filter(target => {
			if (countWildcard(target) > 1) {
				log(
					LogLevel.Warning,
					`Substitution '${target}' in pattern '${pattern}' can have at most one '*' character.`,
				)
				return false
			}
			return true
		})
		if (targets.length === 0) {
			continue
		}
		if (pattern === "*") {
			mappings.push({ wildcard: true, pattern, prefix: "", suffix: "", targets })
			continue
		}
		mappings.push({
			wildcard: wildcard !== -1,
			pattern,
			prefix: pattern.substring(0, wildcard),
			suffix: pattern.substring(wildcard + 1),
			targets,
		})
	}

	for (const mapping of mappings) {
		log(LogLevel.Debug, `pattern: '${mapping.pattern}' targets: '${mapping.targets}'`)
	}

	return mappings
}

export function isPatternMatch(prefix: string, suffix: string, candidate: string): boolean {
	return (
		candidate.length >= prefix.length + suffix.length && candidate.startsWith(prefix) && candidate.endsWith(suffix)
	)
}

export function findMatch(moduleName: string, mappings: Mapping[]): Mapping | undefined {
	let longestMatchedPrefixLength = -1
	let matched: Mapping | undefined
	for (const mapping of mappings) {
		const { wildcard, prefix, suffix, pattern } = mapping
		if (wildcard && isPatternMatch(prefix, suffix, moduleName)) {
			if (longestMatchedPrefixLength < prefix.length) {
				longestMatchedPrefixLength = prefix.length
				matched = mapping
			}
		} else if (moduleName === pattern) {
			matched = mapping
			break
		}
	}
	return matched
}

export function resolveModuleName({
	mappings,
	request,
	importer,
	compilerOptions,
	host,
	falllback,
}: {
	compilerOptions: ts.CompilerOptions
	mappings: Mapping[]
	request: string
	importer: string
	host: ts.ModuleResolutionHost
	falllback?: (moduleName: string) => boolean
}): string | undefined {
	const matched = findMatch(request, mappings)
	if (!matched) {
		return undefined
	}

	const matchedWildcard = request.slice(matched.prefix.length, request.length - matched.suffix.length)

	for (const target of matched.targets) {
		const updated = matched.wildcard ? target.replace("*", matchedWildcard) : target
		const base = (compilerOptions.baseUrl ?? compilerOptions.pathsBasePath) as string
		const moduleName = path.resolve(base, updated)
		const ext = path.extname(moduleName)
		switch (ext) {
			case ".ts":
			case ".tsx":
			case ".json":
			case ".js":
			case ".jsx":
				return moduleName
		}
		const result = ts.resolveModuleName(moduleName, importer, compilerOptions, host)
		if (result?.resolvedModule) {
			return path.normalize(result.resolvedModule.resolvedFileName)
		}
		if (falllback?.(moduleName)) return moduleName
	}

	return undefined
}
