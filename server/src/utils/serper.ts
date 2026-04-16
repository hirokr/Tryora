const SERPER_API_KEY = process.env.SERPER_API_KEY!;

function parsePrice(rawPrice: unknown): number | null {
  if (typeof rawPrice === 'number') {
    return Number.isFinite(rawPrice) ? rawPrice : null;
  }

  if (typeof rawPrice !== 'string') {
    return null;
  }

  const cleaned = rawPrice.trim();
  if (!cleaned) {
    return null;
  }

  // Support common formats like "$1,299.99", "1.299,99", and "BDT 1999".
  const numericPart = cleaned.replace(/[^\d.,-]/g, '');
  if (!numericPart) {
    return null;
  }

  const lastComma = numericPart.lastIndexOf(',');
  const lastDot = numericPart.lastIndexOf('.');

  const normalized =
    lastComma > lastDot
      ? numericPart.replace(/\./g, '').replace(',', '.')
      : numericPart.replace(/,/g, '');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

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
      price: parsePrice(p.price),
      link: p?.link || "",
      image: p.imageUrl,
      source: p.source,
    })) || []
  );
}
