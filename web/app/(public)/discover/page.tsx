"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { DiscoverFeedSection } from "./_components/DiscoverFeedSection";
import { RecommendationSection } from "./_components/RecommendationSection";
import { StyleDiscoveryHero } from "./_components/StyleDiscoveryHero";
import { authFetch } from "@/lib/auth/authFetch";


export default function StyleDiscoveryPage() {
	const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message || "An error occurred while fetching products");
    } finally {
      setIsLoading(false);
    }
  }, []);


	return (
		<main className='relative mx-auto w-full max-w-5xl px-4 pb-14 pt-28 sm:px-6 lg:px-8'>
			<StyleDiscoveryHero />

			<StyleDiscoveryContent
				selectedAesthetic={selectedAesthetic}
				setSelectedAesthetic={setSelectedAesthetic}
				prompt={prompt}
				setPrompt={setPrompt}
				onGenerateRecommendations={handleGenerateRecommendations}
				isGenerating={isGenerating}
				error={error}
			/>

			<RecommendationSection
				show={showRecommendations || isRecommendationsLoading}
				isLoading={isRecommendationsLoading}
				items={recommendations}
				likeCounts={likeCounts}
				viewCounts={viewCounts}
				favourites={favourites}
				onViewed={handleViewed}
				onLike={handleLike}
				onFavoriteToggle={toggleFavourite}
			/>

			<DiscoverFeedSection
				items={discoverProducts}
				isLoading={isDiscoverLoading}
				error={discoverError}
				hasMore={hasMoreDiscover}
				loaderRef={discoverLoaderRef}
				likeCounts={likeCounts}
				viewCounts={viewCounts}
				favourites={favourites}
				onViewed={handleViewed}
				onLike={handleLike}
				onFavoriteToggle={toggleFavourite}
			/>

			<StyleDiscoveryInspirationGrid />
		</main>
	);
}
// End of file
