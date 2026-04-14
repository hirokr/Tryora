"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProcessingSnapshot } from "@/types/ai";
import { clampProgress, formatEta } from "@/utils/ai";

const START_PROGRESS = 68;
const TARGET_PROGRESS = 96;

export const useAiProcessingState = (): ProcessingSnapshot => {
	const [progress, setProgress] = useState(START_PROGRESS);

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((current) => {
				if (current >= TARGET_PROGRESS) {
					return START_PROGRESS;
				}
				return current + 1;
			});
		}, 1200);

		return () => clearInterval(timer);
	}, []);

	return useMemo(() => {
		const neuralProgress = clampProgress(progress);
		const remaining = Math.max(0, 100 - neuralProgress);
		const latencyMs = 10 + (neuralProgress % 7);
		const etaLabel = formatEta(remaining * 2);

		return {
			neuralProgress,
			latencyMs,
			etaLabel,
		};
	}, [progress]);
};
