export async function onRequestGet(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FOOTBALL_API_KEY missing in Cloudflare", data: { matches: [] } }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Real API - brings live, finished with scores 0-3, 1-0, 4-2 and scheduled
  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${date}&lang=en`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
export const onRequest = onRequestGet;
