export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || "2026-10-17";

  // ONLY YOUR KEY NAME
  const API_KEY = context.env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      data: { matches: [] }, 
      error: "FOOTBALL_API_KEY missing in Cloudflare" 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    let rawData = [];

    // YOUR OWN API - use api_key in URL, no X-API-KEY header
    const urlsToTry = [
      `https://api.live-football-api.com/matches?date=${date}&api_key=${API_KEY}`,
      `https://api.live-football-api.com/fixtures?date=${date}&api_key=${API_KEY}`,
      `https://api.live-football-api.com/matches?date=${date}&key=${API_KEY}`,
      `https://api.live-football-api.com/api/matches?date=${date}&api_key=${API_KEY}`
    ];

    for (let apiUrl of urlsToTry) {
      try {
        const res = await fetch(apiUrl, {
          headers: { "Accept": "application/json" }
        });
        if (res.ok) {
          const json = await res.json();
          let data = json.data || json.matches || json.fixtures || json.response || json.result || json;
          if (Array.isArray(data) && data.length > 0) { rawData = data; break; }
          if (data && Array.isArray(data.data) && data.data.length > 0) { rawData = data.data; break; }
        }
      } catch(e) {}
    }

    // If your API uses Bearer token
    if (rawData.length === 0) {
      try {
        const res = await fetch(`https://api.live-football-api.com/matches?date=${date}`, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json"
          }
        });
        if (res.ok) {
          const json = await res.json();
          rawData = json.data || json.matches || [];
        }
      } catch(e) {}
    }

    const matches = rawData.map((f, i) => ({
      id: f.id || i,
      kickoff: f.kickoff || f.date || `${date}T15:00:00Z`,
      time: f.time || "15:00",
      status: {
        status: f.status === "FT" ? "finished" : f.status === "HT" ? "halftime" : f.status || "finished",
        display: f.status || "FT",
        short: f.status || "FT",
        is_live: f.is_live || false,
        elapsed: f.minute || 0
      },
      score: {
        halftime: { home: f.home_score_ht ?? f.ht_home ?? 0, away: f.away_score_ht ?? f.ht_away ?? 1 },
        fulltime: { home: f.home_score ?? 0, away: f.away_score ?? 2 },
        ht: { home: f.home_score_ht ?? 0, away: f.away_score_ht ?? 1 },
        ft: { home: f.home_score ?? 0, away: f.away_score ?? 2 }
      },
      home: { name: f.home_team || f.home || "Home", score: f.home_score ?? 0, ht_score: f.home_score_ht ?? 0 },
      away: { name: f.away_team || f.away || "Away", score: f.away_score ?? 2, ht_score: f.away_score_ht ?? 1 },
      League: { country: f.country || "England", name: f.league_name || "Premier League" },
      league: { country: f.country || "England", name: f.league_name || "
