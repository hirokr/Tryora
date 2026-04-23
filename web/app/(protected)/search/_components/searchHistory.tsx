//-
"use client";

import { useAuth } from "@/context/auth.context";
import { authFetch } from "@/lib/auth/authFetch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SearchHistoryItem = {
	id: string;
	prompt: string;
	intentKey: string;
	timestamp: string;
};

type SearchHistoryResponse = {
	status: string;
	results: SearchHistoryItem[];
};

function SearchHistory() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

	useEffect(() => {
		if (isLoading || !isAuthenticated || !user) {
			setSearchHistory([]);
			return;
		}

		const fetchSearchHistory = async () => {
			try {
				const response = await authFetch("/api/search/history", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					throw new Error("Failed to fetch search history");
				}

				const data = (await response.json()) as SearchHistoryResponse;
				setSearchHistory(data.results || []);
			} catch (error) {
				console.error("Error fetching search history:", error);
			}
		};

		void fetchSearchHistory();
	}, [isLoading, isAuthenticated, user]);

	if (isLoading) {
		return <div>Checking user session...</div>;
	}

	if (!isAuthenticated || !user) {
		return null;
	}

	const handlePrevSearchClick = (searchId: string) => {
		router.push(`/search/${searchId}/products`);
	};

	return (
		<div>
			{searchHistory.length > 0 ? (
				searchHistory.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => handlePrevSearchClick(item.id)}
						className="block w-full text-left"
					>
						{item.prompt}
					</button>
				))
			) : (
				<div>No search history available.</div>
			)}
		</div>
	);
}

export default SearchHistory;
