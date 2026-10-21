export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY || "0bdde243a2a70a0beec84e06428e9b1357b906da3f74ef94ddb69472bb60c0a5";
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  try {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: { "x-apisports-key": API_KEY }
    });
    const data = await res.json();
    return new Response(JSON.stringify(data.response || []), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
