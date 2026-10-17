export async function onRequestGet(context) {
  const date = new URL(context.request.url).searchParams.get("date") || "2026-10-17";
  const API_KEY = context.env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    return Response.json({ data: { matches: [] }, error: "Set FOOTBALL_API_KEY" });
  }

  try {
    // Use query param, no X-API-KEY
    const apiRes = await fetch(`https://api.live-football-api.com/matches?date=${date}&api_key=${API_KEY}`);
    
    let raw = [];
    if (apiRes.ok) {
      const j = await apiRes.json();
      raw = j.data || j.matches || j.response || [];
      if (!Array.isArray(raw) && j.data && Array.isArray(j.data.data)) raw = j.data.data;
    }

    const matches = raw.map((f, i) => ({
      id: f.id || i,
      kickoff: f.date || `${date}T15:00:00Z`,
      time: f.time || "15:00",
      status: {
        status: f.status || "finished",
        display: f.status || "FT",
        short: f.status || "FT",
        is_live: false,
        elapsed: 0
      },
      score: {
        halftime: { home: f.home_score_ht ?? 0, away: f.away_score_ht ?? 0 },
        fulltime: { home: f.home_score ?? 0, away: f.away_score ?? 0 },
        ht: { home: f.home_score_ht ?? 0, away: f.away_score_ht ?? 0 },
        ft: { home: f.home_score ?? 0, away: f.away_score ?? 0 }
      },
      home: { name: f.home_team || "Home", score: f.home_score ?? 0, ht_score: f.home_score_ht ?? 0 },
      away: { name: f.away_team || "Away", score: f.away_score ?? 0, ht_score: f.away_score_ht ?? 0 },
      League: { country: f.country || "England", name: f.league_name || "League" },
      league: { country: f.country || "England", name: f.league_name || "League" }
    }));

    return Response.json({ data: { matches } }, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });

  } catch (e) {
    return Response.json({ data: { matches: [] }, error: e.message });
  }
}
