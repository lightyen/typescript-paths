export enum LogLevel {
	None,
	Error,
	Warning,
	Info,
	Debug,
	Trace,
}

export type LogLevelString = "none" | "error" | "warn" | "info" | "debug" | "trace"

export function convertLogLevel(level?: LogLevelString) {
	switch (level) {
		case "none":
			return LogLevel.None
		case "error":
			return LogLevel.Error
		case "warn":
			return LogLevel.Warning
		case "info":
			return LogLevel.Info
		case "debug":
			return LogLevel.Debug
		case "trace":
			return LogLevel.Trace
		default:
			return undefined
	}
}

interface Options {
	logLevel: LogLevel
	colors?: boolean
	ID?: string
}

export interface LogFunc {
	(level: LogLevel, ...args: any[]): void
}

const Reset = "\x1b[0m"
const FgRed = "\x1b[31m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgCyan = "\x1b[36m"
const FgMagenta = "\x1b[35m"

export function fromTYPESCRIPT_PATHS_LOG_LEVEL() {
	const env = process.env["TYPESCRIPT_PATHS_LOG_LEVEL"]
	switch (env) {
		case "none":
			return LogLevel.None
		case "error":
			return LogLevel.Error
		case "warn":
			return LogLevel.Warning
		case "info":
			return LogLevel.Info
		case "debug":
			return LogLevel.Debug
		case "trace":
			return LogLevel.Trace
		default:
			return undefined
	}
}

export function createLogger({
	logLevel = fromTYPESCRIPT_PATHS_LOG_LEVEL() || LogLevel.Info,
	colors = true,
	ID = "typescript-paths",
}: Partial<Options> = {}): LogFunc {
	return function log(level, ...args) {
		if (logLevel < level) {
			return
		}
		if (ID) {
			args.unshift(`[${ID}]:`)
		}
		if (colors) {
			args = args.map(a => {
				if (typeof a !== "string") return a
				switch (level) {
					case LogLevel.Error:
						return FgRed + a + Reset
					case LogLevel.Warning:
						return FgYellow + a + Reset
					case LogLevel.Info:
						return FgBlue + a + Reset
					case LogLevel.Debug:
						return FgCyan + a + Reset
					case LogLevel.Trace:
						return FgMagenta + a + Reset
				}
			})
		}
		switch (level) {
			case LogLevel.Error:
				console.error(...args)
				break
			case LogLevel.Warning:
				console.warn(...args)
				break
			case LogLevel.Info:
				console.info(...args)
				break
			case LogLevel.Debug:
				console.log(...args)
				break
			case LogLevel.Trace:
				console.log(...args)
				break
		}
	}
}
