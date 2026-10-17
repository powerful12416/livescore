export async function onRequestGet(context) {
  const apikey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: "No ID" }), { status: 400 });

  const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&match_id=${id}&lang=en`;
  
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
