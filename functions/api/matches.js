export async function onRequest(context) {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=20"
  };
  try {
    const KEY = context.env.FOOTBALL_API_KEY;
    if (!KEY) return new Response(JSON.stringify([]), { headers: cors });

    const today = new Date().toISOString().split('T')[0];
    const url = `https://live-football-api.com/api/v1/matches?api_key=${KEY}&date=${today}&lang=en`;
    
    const res = await fetch(url);
    const json = await res.json();
    
    // API returns { data: [...] }
    const data = json.data || json.matches || [];
    return new Response(JSON.stringify(data), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify([]), { headers: cors });
  }
}
