import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { IMAGE_EDIT_JOB_STORAGE_KEY } from "@/constants/flow";

export type ImageEditJobPayload = {
	status: string;
	jobId: string;
	jobType: string;
};

export type ImageEditJobRecord = ImageEditJobPayload & {
	productId: string;
	updatedAt: string;
};

type ImageEditJobState = {
	latestJob: ImageEditJobRecord | null;
	jobsByProductId: Record<string, ImageEditJobRecord>;
	saveJob: (productId: string, payload: ImageEditJobPayload) => void;
	clearJobs: () => void;
};

export const useImageEditJobStore = create<ImageEditJobState>()(
	persist(
		(set) => ({
			latestJob: null,
			jobsByProductId: {},

			saveJob: (productId, payload) => {
				const nextJob: ImageEditJobRecord = {
					...payload,
					productId,
					updatedAt: new Date().toISOString(),
				};

				set((state) => ({
					latestJob: nextJob,
					jobsByProductId: {
						...state.jobsByProductId,
						[productId]: nextJob,
					},
				}));
			},

			clearJobs: () => {
				set({
					latestJob: null,
					jobsByProductId: {},
				});
			},
		}),
		{
			name: IMAGE_EDIT_JOB_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				latestJob: state.latestJob,
				jobsByProductId: state.jobsByProductId,
			}),
		},
	),
);
