"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";

import Loader from "@/components/ui/Loader";

type UserLocation = {
	latitude: number;
	longitude: number;
	country: string;
};

type resutls = {
	id: string;
	searchId: string;
	title: string;
	source: string;
	googlelink: string;
	price: string;
	defaultImageUrl: string;
	rating: number;
	ratingCount: number;
};

type searchResponse = {
	status: string;
	intentKey: string;
	searchId: string;
	results: resutls[];
};

export default function SearchPage() {
	const [prompt, setPrompt] = useState("");
	const [location, setLocation] = useState<UserLocation | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSearch = useCallback(async () => {
		if (!prompt.trim()) return;

		setLoading(true);
		setError("");

		try {
			const response = await authFetch(`/api/search/search`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt,
					location: location?.country,
				}),
			});

			if (!response.ok) {
				throw new Error("Search failed");
			}

			const data = (await response.json()) as searchResponse;
			// Handle search results (e.g., navigate to results page or display results)
			console.log("Search results:", data);
		} catch (searchError) {
			setError(
				searchError instanceof Error
					? searchError.message
					: "An error occurred during search",
			);
		} finally {
			setLoading(false);
		}
	}, [prompt, location]);

	const handleDetectLocation = useCallback(async () => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported by your browser");
			return;
		}

		setError("");

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				const res = await fetch(
					`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
				);

				const data = await res.json();

				const country = data.address?.country || null;
				// For simplicity, we'll just use the coordinates as the "country"
				setLocation({ latitude, longitude, country });
			},
			(geoError) => {
				setError(
					geoError instanceof GeolocationPositionError
						? geoError.message
						: "Failed to detect location",
				);
			},
		);
	}, [location]);

	useEffect(() => {
		void handleDetectLocation();
	}, [handleDetectLocation]);

	return (
		<main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pb-36 lg:px-8">
			<section className="rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white shadow-lg shadow-black/20 sm:p-8">
				<p className="text-xs uppercase tracking-[0.2em] text-primary">AI Search</p>
				<h1 className="mt-2 text-3xl font-bold">Find styles instantly</h1>
				<p className="mt-2 text-sm text-slate-300">
					Search with prompt + your location for better local recommendations.
				</p>

				<div className="mt-6 space-y-3">
					<textarea
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					placeholder="Try: modern black cocktail dress under 150"
					className="min-h-40 w-full rounded-xl border border-primary/20 bg-black/20 px-4 py-4 text-base text-white outline-none focus:border-primary"
					/>

					<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={handleSearch}
						disabled={loading || !prompt.trim()}
						className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? "Searching..." : "Run AI Search"}
					</button>


					
 

		      {location ? (
		        <p className="mt-3 text-xs text-emerald-300">
		          Location: {location?.country || "Unknown country"} ({location?.latitude.toFixed(3)},{" "}
		          {location?.longitude.toFixed(3)})
		        </p>
		      ) : null}
		      

		      
		      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
			</div>
			</div>
      </section>
    </main>
	);
}


