export function formatLog({
	level,
	value,
	colors = true,
	loggerID = "typescript-paths",
}: {
	level: "error" | "warn" | "info"
	value: unknown
	colors?: boolean
	loggerID?: string
}) {
	let message = ""
	switch (level) {
		case "error":
			message = `[${loggerID}]: ${value}`
		case "warn":
			message = `[${loggerID}]: ${value}`
		default:
			message = `[${loggerID}]: ${value}`
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
