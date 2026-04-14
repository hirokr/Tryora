export interface ProcessingBar {
	heightClass: string;
	opacityClass: string;
}

export interface ResultMetric {
	label: string;
	value: string;
}

export interface ProcessingSnapshot {
	neuralProgress: number;
	latencyMs: number;
	etaLabel: string;
}
