export async function onRequestGet(context) {
  const date = new URL(context.request.url).searchParams.get("date") || "2026-10-17";
  const TOKEN = context.env.FOOTBALL_API_KEY;

  if (!TOKEN) {
    return Response.json({ data: { matches: [] }, debug: "FOOTBALL_API_KEY missing" });
  }

  const debugLogs = [];

  // Test your API directly
  const testUrls = [
    `https://api.live-football-api.com/matches?date=${date}&token=${TOKEN}`,
    `https://api.live-football-api.com/matches?date=${date}&api_token=${TOKEN}`,
    `https://api.live-football-api.com/fixtures?date=${date}&api_token=${TOKEN}`
  ];

  for (let u of testUrls) {
    try {
      const r = await fetch(u);
      const text = await r.text();
      debugLogs.push({ url: u.split("&token=")[0]+"&token=HIDDEN", status: r.status, body: text.slice(0, 300) });
      // try parse if ok
      if (r.ok) {
        try {
          const j = JSON.parse(text);
          const arr = j.data || j.matches || [];
          if (Array.isArray(arr) && arr.length > 0) {
            return Response.json({ data: { matches: arr.map((f,i)=>({
              id:f.id||i, kickoff:f.date||`${date}T15:00:00Z`, time:"15:00",
              status:{status:f.status||"finished", display:f.status||"FT", short:f.status||"FT", is_live:false},
              score:{ halftime:{home:f.home_score_ht??0, away:f.away_score_ht??0}, fulltime:{home:f.home_score??0, away:f.away_score??0}, ht:{home:f.home_score_ht??0, away:f.away_score_ht??0}, ft:{home:f.home_score??0, away:f.away_score??0} },
              home:{name:f.home_team||"Home", score:f.home_score??0, ht_score:f.home_score_ht??0},
              away:{name:f.away_team||"Away", score:f.away_score??0, ht_score:f.away_score_ht??0},
              League:{country:"France", name:f.league_name||"League"}, league:{country:"France", name:f.league_name||"League"}
            }))}, debug: debugLogs }, { headers: {"Access-Control-Allow-Origin":"*"}});
          }
        } catch {}
      }
    } catch (e) {
      debugLogs.push({ url: u, error: e.message });
    }
  }

  // If all empty, return debug so we see why
  return Response.json({ data: { matches: [] }, debug: debugLogs, hint: "Check live-football-api.com Dashboard > Request Logs - maybe credits 0 or date wrong" }, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
  });
}
