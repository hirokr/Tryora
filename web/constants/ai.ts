import type { ProcessingBar, ResultMetric } from "@/types/ai";

export const PROCESSING_GEOMETRY_BARS: ProcessingBar[] = [
	{ heightClass: "h-4", opacityClass: "opacity-60" },
	{ heightClass: "h-6", opacityClass: "opacity-80" },
	{ heightClass: "h-3", opacityClass: "opacity-40" },
	{ heightClass: "h-5", opacityClass: "opacity-90" },
	{ heightClass: "h-2", opacityClass: "opacity-30" },
];

export const RESULT_METRICS: ResultMetric[] = [
	{ label: "Mesh Accuracy", value: "99.4%" },
	{ label: "Texture Fidelity", value: "4K Ultra" },
	{ label: "Biometric Alignment", value: "Verified" },
];

export const AI_RESULT_AVATAR_IMAGE =
	"web/public/ai_result.png";
