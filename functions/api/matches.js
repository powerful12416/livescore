export async function onRequestGet(context) {
  const env = context.env;
  const API_KEY = env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({error: "API not ready - FOOTBALL_API_KEY missing", envExists: false}), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }

  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || 'today';

  // Convert date to YYYY-MM-DD for API
  let apiDate = new Date().toISOString().split('T')[0];
  if (date === 'yesterday') {
    const d = new Date(); d.setDate(d.getDate()-1); apiDate = d.toISOString().split('T')[0];
  } else if (date === 'tomorrow') {
    const d = new Date(); d.setDate(d.getDate()+1); apiDate = d.toISOString().split('T')[0];
  }

  try {
    const apiRes = await fetch(`https://api.live-football-api.com/matches?date=${apiDate}`, {
      headers: {
        "x-api-key": API_KEY
      }
    });
    const data = await apiRes.json();
    
    return new Response(JSON.stringify(data.matches || data || []), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({error: e.message}), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
