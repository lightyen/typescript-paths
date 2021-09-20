export declare function formatLog({
	level,
	value,
	colors,
	loggerID,
}: {
	level: "error" | "warn" | "info"
	value: unknown
	colors?: boolean
	loggerID?: string
}): string
