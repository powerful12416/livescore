export async function onRequestGet(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FOOTBALL_API_KEY missing", data: { matches: [] } }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Check cache first - save credits!
  const cacheKey = `matches_${date}`;
  const cache = caches.default;
  const cacheUrl = new URL(`https://cache.local/${cacheKey}`);
  let cached = await cache.match(cacheUrl);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "HIT - no credit used",
        "Cache-Control": "public, max-age=60"
      }
    });
  }

  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${date}&lang=en`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    const response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
        "X-Cache": "MISS - 1 credit used"
      }
    });

    // Save to cache for 60 seconds - next user won't use credit
    const cacheResponse = response.clone();
    cacheResponse.headers.set('Cache-Control', 'public, max-age=60');
    context.waitUntil(cache.put(cacheUrl, cacheResponse));

    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
export const onRequest = onRequestGet;
