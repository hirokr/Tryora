"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import type { SearchResponse } from "@/types/search";
import { authFetch } from "@/lib/auth/authFetch";

type FilterState = {
	category: string;
	color: string;
	minBudget: string;
	maxBudget: string;
};

type UserLocation = {
	latitude: number;
	longitude: number;
	country: string;
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
			const response = await authFetch(`${BACKEND_URL}/api/search`, {
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

			const data = (await response.json()) as SearchResponse;
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
		// <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pb-36 lg:px-8">
		//   <section className="rounded-2xl border border-primary/20 bg-[#191022] p-6 text-white shadow-lg shadow-black/20 sm:p-8">
		//       <p className="text-xs uppercase tracking-[0.2em] text-primary">AI Search</p>
		//       <h1 className="mt-2 text-3xl font-bold">Find styles instantly</h1>
		//       <p className="mt-2 text-sm text-slate-300">
		//         Search with prompt + your location for better local recommendations.
		//       </p>

		//       <div className="mt-6 space-y-3">
		//         <textarea
		//           value={prompt}
		//           onChange={(event) => setPrompt(event.target.value)}
		//           placeholder="Try: modern black cocktail dress under 150"
		//           className="min-h-40 w-full rounded-xl border border-primary/20 bg-black/20 px-4 py-4 text-base text-white outline-none focus:border-primary"
		//         />

		//         <div className="flex flex-wrap items-center gap-3">
		//           <button
		//             type="button"
		//             onClick={runSearch}
		//             disabled={isLoading || !prompt.trim()}
		//             className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
		//           >
		//             {isLoading ? "Searching..." : "Run AI Search"}
		//           </button>

		//           <button
		//             type="button"
		//             onClick={detectUserLocation}
		//             disabled={isResolvingLocation}
		//             className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
		//           >
		//             {isResolvingLocation ? "Detecting location..." : "Use my location"}
		//           </button>

		//           <Link
		//             href="/search/trending"
		//             className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-primary"
		//           >
		//             Trending
		//           </Link>

		//           <button
		//             type="button"
		//             onClick={() => setFiltersExpanded((previous) => !previous)}
		//             className={`rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-all ${
		//               filtersExpanded ? "bg-primary/10" : ""
		//             }`}
		//           >
		//             Advance Filter
		//           </button>
		//         </div>

		//         {filtersExpanded ? (
		//           <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
		//             <div className="flex flex-wrap gap-3 lg:flex-nowrap">
		//               <div className="min-w-[140px] flex-1">
		//                 <label className="mb-1 block text-xs uppercase text-slate-300">Category</label>
		//                 <input
		//                   value={filters.category}
		//                   onChange={(event) =>
		//                     setFilters((previous) => ({ ...previous, category: event.target.value }))
		//                   }
		//                   placeholder="Jackets"
		//                   className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
		//                 />
		//               </div>

		//               <div className="min-w-[140px] flex-1">
		//                 <label className="mb-1 block text-xs uppercase text-slate-300">Color</label>
		//                 <input
		//                   value={filters.color}
		//                   onChange={(event) =>
		//                     setFilters((previous) => ({ ...previous, color: event.target.value }))
		//                   }
		//                   placeholder="Black"
		//                   className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
		//                 />
		//               </div>

		//               <div className="min-w-[140px] flex-1">
		//                 <label className="mb-1 block text-xs uppercase text-slate-300">Min Budget</label>
		//                 <input
		//                   value={filters.minBudget}
		//                   onChange={(event) =>
		//                     setFilters((previous) => ({ ...previous, minBudget: event.target.value }))
		//                   }
		//                   type="number"
		//                   min={0}
		//                   placeholder="50"
		//                   className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
		//                 />
		//               </div>

		//               <div className="min-w-[140px] flex-1">
		//                 <label className="mb-1 block text-xs uppercase text-slate-300">Max Budget</label>
		//                 <input
		//                   value={filters.maxBudget}
		//                   onChange={(event) =>
		//                     setFilters((previous) => ({ ...previous, maxBudget: event.target.value }))
		//                   }
		//                   type="number"
		//                   min={0}
		//                   placeholder="250"
		//                   className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
		//                 />
		//               </div>

		//               <div className="min-w-[140px] self-end lg:w-auto">
		//                 <button
		//                   type="button"
		//                   onClick={runFilteredSearch}
		//                   disabled={isLoading}
		//                   className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
		//                 >
		//                   {isLoading ? "Filtering..." : "Apply filter"}
		//                 </button>
		//               </div>
		//             </div>
		//           </div>
		//         ) : null}
		//       </div>

		//       {userLocation ? (
		//         <p className="mt-3 text-xs text-emerald-300">
		//           Location: {userLocation.country || "Unknown country"} ({userLocation.latitude.toFixed(3)},{" "}
		//           {userLocation.longitude.toFixed(3)})
		//         </p>
		//       ) : null}
		//       {locationError ? <p className="mt-3 text-xs text-red-300">{locationError}</p> : null}

		//       {status ? (
		//         <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">Status: {status}</p>
		//       ) : null}
		//       {searchId ? (
		//         <Link
		//           href={`/search/${searchId}/products`}
		//           className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
		//         >
		//           View all products for search {searchId}
		//         </Link>
		//       ) : null}
		//       {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

		//   </section>
		// </main>
		<></>
	);
} // End of file
