export async function onRequestGet(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: "FOOTBALL_API_KEY no dey for Cloudflare Pages env", 
      data: { matches: [] } 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
  
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  // This API brings ALL - live, finished with scores 4-2, 0-3, and scheduled
  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${date}&lang=en`;
  
  try {
    const res = await fetch(apiUrl);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { data: { matches: [] } }; }
    
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
export const onRequest = onRequestGet;
