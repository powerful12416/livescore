export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  
  if (!API_KEY) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(context.request.url);
  const dateParam = url.searchParams.get('date') || 'today';
  
  let targetDate = new Date();
  if (dateParam === 'yesterday') targetDate.setDate(targetDate.getDate()-1);
  if (dateParam === 'tomorrow') targetDate.setDate(targetDate.getDate()+1);
  if (dateParam === 'Sun 18') targetDate = new Date('2026-10-18');
  if (dateParam === 'Thu 22') targetDate = new Date('2026-10-22');
  
  const dateStr = targetDate.toISOString().split('T')[0];

  try {
    const res = await fetch(`https://api.live-football-api.com/matches?date=${dateStr}`, {
      headers: { "X-API-Key": API_KEY, "x-api-key": API_KEY }
    });
    const json = await res.json();
    
    // Return whatever API returns - normalize
    const matches = json.data || json.matches || json || [];
    return new Response(JSON.stringify(matches), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
