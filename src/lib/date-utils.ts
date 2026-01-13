/**
 * Format a timestamp to show time in HH:MM format
 */
export function formatTime(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

/**
 * Format a date string to relative time (e.g., "Just now", "5m ago", "Yesterday")
 * Falls back to localized date for older dates
 */
export function formatRelativeDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	// Try to use RelativeTimeFormat for supported browsers
	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

	if (diffMinutes < 1) {
		return "Just now";
	}

	if (diffMinutes < 60) {
		return rtf.format(-diffMinutes, "minute");
	}

	if (diffHours < 24) {
		return rtf.format(-diffHours, "hour");
	}

	if (diffDays === 1) {
		return rtf.format(-1, "day"); // "yesterday"
	}

	if (diffDays < 7) {
		return rtf.format(-diffDays, "day");
	}

	// For older dates, use localized date format
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}
