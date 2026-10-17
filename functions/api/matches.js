export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || "2026-10-16";
  
  // Accept ALL names - including FOOTBALL_API_KEY wey you use!
  const API_KEY = context.env.FOOTBALL_API_KEY || context.env.LIVE_FOOTBALL_API_KEY || context.env.API_FOOTBALL_KEY || context.env.API_KEY || context.env.LIVE_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      data: { matches: [] }, 
      error: "FOOTBALL_API_KEY not found - check Cloudflare env vars" 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // For live-football-api.com
    const endpoints = [
      `https://api.live-football-api.com/matches?date=${date}`,
      `https://api.live-football-api.com/fixtures?date=${date}`,
      `https://api.live-football-api.com/v1/matches?date=${date}`
    ];

    let raw = [];
    for (let endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "X-API-Key": API_KEY,
            "x-api-key": API_KEY,
            "Authorization": API_KEY,
            "apikey": API_KEY,
            "Accept": "application/json"
          }
        });
        if (res.ok) {
          const json = await res.json();
          let data = json.data || json.matches || json.response || json.fixtures || json.result || [];
          if (Array.isArray(data) && data.length > 0) { raw = data; break; }
          if (data.data && Array.isArray(data.data)) { raw = data.data; break; }
        }
      } catch(e) {}
    }

    // If still empty, try with api_key param
    if (raw.length === 0) {
      try {
        const res = await fetch(`https://api.live-football-api.com/matches?date=${date}&api_key=${API_KEY}`, {
          headers: { "Accept": "application/json" }
        });
        if (res.ok) {
          const json = await res.json();
          raw = json.data || json.matches || [];
        }
      } catch(e) {}
    }

    const matches = raw.map((f, i) => {
      const homeName = f.home_team || f.home || f.teams?.home?.name || f.home_name || "Home";
      const awayName = f.away_team || f.away || f.teams?.away?.name || f.away_name || "Away";
      const homeFT = f.home_score ?? f.goals_home ?? f.score?.fulltime?.home ?? f.score?.home ?? null;
      const awayFT = f.away_score ?? f.goals_away ?? f.score?.fulltime?.away ?? f.score?.away ?? null;
      const homeHT = f.home_score_ht ?? f.home_ht ?? f.score?.halftime?.home ?? f.score?.ht?.home ?? f.ht_home ?? 0;
      const awayHT = f.away_score_ht ?? f.away_ht ?? f.score?.halftime?.away ?? f.score?.ht?.away ?? f.ht_away ?? 1;
      const statusRaw = (f.status || f.match_status || "").toString();
      
      return {
        id: f.id || f.fixture_id || i,
        kickoff: f.kickoff || f.date || f.fixture_date || `${date}T15:00:00Z`,
        time: f.time || "15:00",
        status: {
          status: statusRaw.toLowerCase().includes("finished") || statusRaw === "FT" ? "finished" : statusRaw === "HT" ? "halftime" : statusRaw,
          display: statusRaw || "FT",
          short: statusRaw || "FT",
          is_live: f.is_live || statusRaw.includes("LIVE") || statusRaw.includes("1H"),
          elapsed: f.minute || 0
        },
        score: {
          halftime: { home: homeHT, away: awayHT },
          fulltime: { home: homeFT, away: awayFT },
          ht: { home: homeHT, away: awayHT },
          ft: { home: homeFT, away: awayFT }
        },
        home: { name: typeof homeName === 'string' ? homeName : homeName.name || "Home", score: homeFT, ht_score: homeHT, halftime: homeHT },
        away: { name: typeof awayName === 'string' ? awayName : awayName.name || "Away", score: awayFT, ht_score: awayHT, halftime: awayHT },
        League: { country: f.country || f.league?.country || "England", name: f.league_name || f.league?.name || "Premier League" },
        league: { country: f.country || f.league?.country || "England", name: f.league_name || f.league?.name || "Premier League" }
      };
    });

    return new Response(JSON.stringify({ data: { matches } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json" }, status: 500
    });
  }
}
