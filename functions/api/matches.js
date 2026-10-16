export async function onRequestGet(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API KEY missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${date}&lang=en`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
export const onRequest = onRequestGet;
