import { Product } from '#src/types/product.js';

const SERPER_API_KEY = process.env.SERPER_API_KEY!;

export async function searchSerper(query: string, num = 10) {
  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num }),
  });

  if (!res.ok) throw new Error('Serper failed');

  const data = await res.json();

  return (
    data.shopping?.map(
      (p: any): Product => ({
        title: p.title,
        price: p.price,
        googlelink: p?.link || '',
        defaultImageUrl: p.imageUrl,
        source: p.source,
        rating: p.rating,
        ratingCount: p.ratingCount,
        searchProductId: p.productId,
      })
    ) || []
  );
}
