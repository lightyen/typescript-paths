export type LogLevel = "warn" | "debug" | "none"

export function formatLog(level: "error" | "warn" | "info", value: unknown, colors = true) {
	let message = ""
	switch (level) {
		case "error":
			message = `[typescript-paths]: ${value}`
		case "warn":
			message = `[typescript-paths]: ${value}`
		default:
			message = `[typescript-paths]: ${value}`
	}

	if (colors) {
		switch (level) {
			case "error":
				return `\x1b[1;31m${message}\x1b[0m`
			case "warn":
				return `\x1b[1;33m${message}\x1b[0m`
			default:
				return `\x1b[1;34m${message}\x1b[0m`
		}
	}

	return message
}
