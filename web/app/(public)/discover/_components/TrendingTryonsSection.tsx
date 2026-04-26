
import type {
	FeedCardHandlers,
	FeedProduct,
} from "../../../../types/feedTypes";

type TrendingTryonsSectionProps = {
	show: boolean;
	isLoading: boolean;
	error: string | null;
	items: FeedProduct[];
	likeCounts: Record<string, number>;
	viewCounts: Record<string, number>;
	favourites: Record<string, boolean>;
} & FeedCardHandlers;

export function TrendingTryonsSection({
	show,
	isLoading,
	error,
	items,
	likeCounts,
	viewCounts,
	favourites,
	onViewed,
	onLike,
	onFavoriteToggle,
}: TrendingTryonsSectionProps) {
	if (!show) return null;

	return (
		<section className='mt-10'>
			<div className='mb-4'>
				<p className='text-xs uppercase tracking-[0.2em] text-primary'>
					Trending
				</p>
				<h2 className='text-xl font-bold text-white'>
					People are using these try-on looks
				</h2>
				<p className='mt-1 text-sm text-slate-300'>
					Public try-on images are shown here when users publish them.
				</p>
			</div>

			{error ? <p className='mb-4 text-sm text-red-300'>{error}</p> : null}
			{isLoading ? (
				<p className='text-sm text-slate-300'>Loading trending try-ons...</p>
			) : null}

			{/* <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{items.map((product, index) => (
					<SearchProductCard
						key={product.id || `${product.title}-${index}`}
						product={product}
						detailsHref={product.id ? `/discover/${product.id}` : undefined}
						likeCount={likeCounts[product.id || ""]}
						viewCount={viewCounts[product.id || ""]}
						isFavorited={Boolean(favourites[product.id || ""])}
						tryOnHref={product.tryOnUrl || product.productUrl || undefined}
						onViewed={onViewed}
						onLike={onLike}
						onFavoriteToggle={onFavoriteToggle}
					/>
				))}
			</div> */}
		</section>
	);
} // This component, `TrendingTryonsSection`, is responsible for displaying a section of trending try-on products on the Style Discovery page. It takes in props to manage the loading state, error messages, and the list of products to display. Each product is rendered using the `SearchProductCard` component, which includes functionality for viewing, liking, and favoriting products. The section is styled with a dark theme and includes a header and description for the trending try-ons.
