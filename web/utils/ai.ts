export const clampProgress = (value: number, min = 0, max = 100): number => {
	return Math.min(max, Math.max(min, Math.round(value)));
};

export const formatEta = (seconds: number): string => {
	const safeSeconds = Math.max(0, Math.floor(seconds));
	const mins = Math.floor(safeSeconds / 60);
	const secs = String(safeSeconds % 60).padStart(2, "0");
	return `${mins}:${secs}s`;
};
