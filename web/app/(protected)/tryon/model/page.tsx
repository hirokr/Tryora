"use client";

import { authFetch } from "@/lib/auth/authFetch";
import { useEffect, useState } from "react";
import { useTryonSocket } from "@/context/tryonSocket.context";
import { Button } from "@/components/ui/button";

type QueueJobResponse = {
	jobId?: string;
	message?: string;
};

export default function TryOnModelPage() {
	const [selectedTryonId, setSelectedTryonId] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { connectIfNeeded, subscribeToJob } = useTryonSocket();

	useEffect(() => {
		void connectIfNeeded();
	}, [connectIfNeeded]);

	const handleGenerateTryOn = async () => {
		setIsLoading(true);
		setError(null);

		const jobPayload = await authFetch("/api/tryon/model/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tryonId: selectedTryonId,
			}),
		});

		if (!jobPayload.ok) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		const payload = (await jobPayload
			.json()
			.catch(() => ({}))) as QueueJobResponse;
		const jobId = typeof payload.jobId === "string" ? payload.jobId : "";

		if (!jobId) {
			setError("Failed to generate try-on.");
			setIsLoading(false);
			return;
		}

		await subscribeToJob(jobId);
		setIsLoading(false);
	};

	return (
		<div className='mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8'>
			<div className='rounded-xl border border-white/10 bg-black/20 p-6 text-white'>
				<label className='text-sm text-slate-300' htmlFor='tryon-id-input'>
					Try-on id
				</label>
				<input
					id='tryon-id-input'
					value={selectedTryonId}
					onChange={(event) => setSelectedTryonId(event.target.value)}
					placeholder='Enter tryon id'
					className='mt-2 w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none'
				/>
				<Button
					className='mt-4'
					onClick={() => {
						void handleGenerateTryOn();
					}}
					disabled={isLoading || !selectedTryonId.trim()}
				>
					{isLoading ? "Queuing..." : "Start model generation"}
				</Button>
				{error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}
			</div>
		</div>
	);
}
