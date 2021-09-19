export type LogLevel = "warn" | "debug" | "none"

export function formatLog(level: "error" | "warn" | "info", value: unknown) {
	switch (level) {
		case "error":
			return `\x1b[1;31m[tsconfig-paths]: ${value}\x1b[0m`
		case "warn":
			return `\x1b[1;33m[tsconfig-paths]: ${value}\x1b[0m`
		default:
			return `\x1b[1;34m[tsconfig-paths]: ${value}\x1b[0m`
	}
}
