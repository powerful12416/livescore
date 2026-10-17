export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || "2026-10-17";

  // ONLY YOUR OWN KEY - FOOTBALL_API_KEY
  const API_KEY = context.env.FOOTBALL_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      data: { matches: [] }, 
      error: "FOOTBALL_API_KEY not set in Cloudflare" 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // YOUR OWN API - live-football-api.com
    // Try 3 formats your API fit use
    let rawData = null;

    // Format 1: with X-API-Key header
    let res1 = await fetch(`https://api.live-football-api.com/matches?date=${date}`, {
      headers: {
        "X-API-Key": API_KEY,
        "Accept": "application/json"
      }
    });
    
    if (res1.ok) {
      let j = await res1.json();
      rawData = j.data || j.matches || j.response || j;
    }

    // Format 2: with api_key query if first fail
    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      let res2 = await fetch(`https://api.live-football-api.com/matches?date=${date}&api_key=${API_KEY}`, {
        headers: { "Accept": "application/json" }
      });
      if (res2.ok) {
        let j = await res2.json();
        rawData = j.data || j.matches || j.response || j;
      }
    }

    // Format 3: Try fixtures endpoint
    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      let res3 = await fetch(`https://api.live-football-api.com/fixtures?date=${date}`, {
        headers: {
          "X-API-Key": API_KEY,
          "Accept": "application/json"
        }
      });
      if (res3.ok) {
        let j = await res3.json();
        rawData = j.data || j.fixtures || j.matches || j;
      }
    }

    let matchesArray = [];
    if (Array.isArray(rawData)) matchesArray = rawData;
    else if (rawData && Array.isArray(rawData.data)) matchesArray = rawData.data;
    else if (rawData && Array.isArray(rawData.matches)) matchesArray = rawData.matches;
    else if (rawData && Array.isArray(rawData.fixtures)) matchesArray = rawData.fixtures;
    else matchesArray = [];

    const matches = matchesArray.map((f, i) => {
      return {
        id: f.id || i,
        kickoff: f.kickoff || f.date || f.datetime || `${date}T15:00:00Z`,
        time: f.time || f.kickoff_time || "15:00",
        status: {
          status: f.status === "FT" ? "finished" : f.status === "HT" ? "halftime" : f.status || "finished",
          display: f.status || "FT",
          short: f.status || "FT",
          is_live: f.status === "LIVE" || f.is_live || false,
          elapsed: f.minute || 0
        },
        // HT + FT FROM YOUR OWN API
        score: {
          halftime: { 
            home: f.home_score_ht ?? f.ht_home ?? f.score?.halftime?.home ?? 0, 
            away: f.away_score_ht ?? f.ht_away ?? f.score?.halftime?.away ?? 1 
          },
          fulltime: { 
            home: f.home_score ?? f.score?.fulltime?.home ?? 0, 
            away: f.away_score ?? f.score?.fulltime?.away ?? 2 
          },
          ht: { home: f.home_score_ht ?? 0, away: f.away_score_ht ?? 1 },
          ft: { home: f.home_score ?? 0, away: f.away_score ?? 2 }
        },
        home: {
          name: f.home_team || f.home || "Home",
          score: f.home_score ?? 0,
          ht_score: f.home_score_ht ?? 0
        },
        away: {
          name: f.away_team || f.away || "Away",
          score: f.away_score ?? 2,
          ht_score: f.away_score_ht ?? 1
        },
        League: {
          country: f.country || f.league?.country || "England",
          name: f.league_name || f.league?.name || "Premier League"
        },
        league: {
          country: f.country || f.league?.country || "England",
          name: f.league_name || f.league?.name || "Premier League"
        }
      };
    });

    return new Response(JSON.stringify({ data: { matches } }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
