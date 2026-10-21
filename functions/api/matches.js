export async function onRequest(context) {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache"
  };
  try {
    const KEY = context.env.FOOTBALL_API_KEY;
    if (!KEY) return new Response(JSON.stringify([]), { headers: cors });

    // Today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // 1 credit per call - gets today's matches
    const url = `https://live-football-api.com/api/v1/matches?api_key=${KEY}&date=${today}&lang=en`;
    
    const r = await fetch(url);
    const j = await r.json();
    
    // Response is { data: [...] } or direct array
    const matches = j.data || j.matches || j || [];
    
    return new Response(JSON.stringify(matches), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify([]), { headers: cors });
  }
}
