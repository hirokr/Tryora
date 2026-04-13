const SERPER_API_KEY = process.env.SERPER_API_KEY!;

export async function searchShopping(query: string, limit: number = 20) {
  try {
    const response = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper Shopping API failed: ${response.status}`);
    }

    const data = await response.json();

    const products =
      data.shopping?.map((item: any) => ({
        title: item.title,
        price: item.price,
        source: item.source,
        link: item.link,
        image: item.imageUrl,
        rating: item.rating,
        ratingCount: item.ratingCount,
      })) || [];

    return {
      status: true,
      query,
      results: products,
    };
  } catch (error: any) {
    console.error('Serper Shopping Error:', error.message);

    return {
      status: false,
      message: error.message || 'Shopping search failed',
    };
  }
}
