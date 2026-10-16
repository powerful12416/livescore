export async function onRequestGet(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API KEY missing" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
  
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  // This API returns ALL matches for that date with scores - live, finished, scheduled
  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${date}&lang=en`;
  
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    // No cache for past dates so you see real results like 4-2
    const today = new Date().toISOString().split('T')[0];
    const isPast = date < today;
    
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": isPast ? "no-store" : "public, max-age=30"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
export const onRequest = onRequestGet;
