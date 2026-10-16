export async function onRequest(context) {
  const apiKey = context.env.FOOTBALL_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FOOTBALL_API_KEY not set in Cloudflare" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const apiUrl = `https://live-football-api.com/api/v1/matches?api_key=${apiKey}&date=${today}&lang=en`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message, matches: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
