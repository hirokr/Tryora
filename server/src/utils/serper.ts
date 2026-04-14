const SERPER_API_KEY = process.env.SERPER_API_KEY!;

export async function searchSerper(query: string, num = 20) {
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
    data.shopping?.map((p: any) => ({
      title: p.title,
      price: p.price,
      link: p.link,
      image: p.imageUrl,
      source: p.source,
    })) || []
  );
}
