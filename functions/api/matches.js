export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

  // GET YOUR KEY FROM CLOUDFLARE ENV
  const API_KEY = context.env.LIVE_FOOTBALL_API_KEY || context.env.API_KEY || context.env.LIVE_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      error: "Add your live-football-api.com key in Cloudflare: Settings > Variables > LIVE_FOOTBALL_API_KEY",
      data: { matches: [] } 
    }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    // live-football-api.com endpoints - try main ones
    let responseData = null;
    
    // Try 1: /v1/fixtures or /matches
    const endpoints = [
      `https://api.live-football-api.com/v1/matches?date=${date}`,
      `https://api.live-football-api.com/matches?date=${date}`,
      `https://api.live-football-api.com/fixtures?date=${date}`,
      `https://live-football-api.com/api/v1/matches?date=${date}`
    ];

    for (let apiUrl of endpoints) {
      try {
        const r = await fetch(apiUrl, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "X-API-Key": API_KEY,
            "x-api-key": API_KEY,
            "apikey": API_KEY,
            "Accept": "application/json"
          }
        });
        if (r.ok) {
          const j = await r.json();
          if (j && (j.data || j.matches || j.response || j.fixtures)) {
            responseData = j;
            break;
          }
        }
      } catch(e) {}
    }

    // If API fails, try with query param key
    if (!responseData) {
      const r = await fetch(`https://api.live-football-api.com/v1/matches?date=${date}&api_key=${API_KEY}&key=${API_KEY}`, {
        headers: { "Accept": "application/json" }
      });
      if (r.ok) responseData = await r.json();
    }

    if (!responseData) {
      return new Response(JSON.stringify({ data: { matches: [] }, error: "Could not fetch from live-football-api.com - check API key" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract matches array (different API versions use different keys)
    let rawMatches = responseData.data || responseData.matches || responseData.response || responseData.fixtures || responseData.result || [];

    if (!Array.isArray(rawMatches) && rawMatches.matches) rawMatches = rawMatches.matches;
    if (!Array.isArray(rawMatches)) rawMatches = [];

    const matches = rawMatches.map((f, idx) => {
      // Normalize different API formats
      const homeTeam = f.home_team || f.homeTeam || f.teams?.home || f.team_home || {};
      const awayTeam = f.away_team || f.awayTeam || f.teams?.away || f.team_away || {};
      const homeName = homeTeam.name || f.home || f.home_name || "Home";
      const awayName = awayTeam.name || f.away || f.away_name || "Away";
      
      const score = f.score || f.scores || {};
      const ftHome = score.full_time?.home ?? score.ft?.home ?? score.fullTime?.home ?? f.home_score ?? f.goals_home ?? f.score_home ?? null;
      const ftAway = score.full_time?.away ?? score.ft?.away ?? score.fullTime?.away ?? f.away_score ?? f.goals_away ?? f.score_away ?? null;
      const htHome = score.half_time?.home ?? score.ht?.home ?? score.halfTime?.home ?? f.ht_home_score ?? f.home_ht_score ?? null;
      const htAway = score.half_time?.away ?? score.ht?.away ?? f.ht_away_score ?? f.away_ht_score ?? null;

      const statusRaw = (f.status || f.match_status || f.fixture_status || "").toString().toLowerCase();
      const statusShort = (f.status_short || f.status || "").toString();
      
      let display = "NS";
      let isFinished = statusRaw.includes("finished") || statusRaw === "ft" || statusShort === "FT";
      let isHT = statusRaw.includes("halftime") || statusRaw === "ht" || statusShort === "HT";
      let isLive = f.is_live || statusRaw.includes("live") || ["1h","2h","ht","live"].includes(statusRaw);

      if (isFinished) display = "FT";
      else if (isHT) display = "HT";
      else if (isLive && f.minute) display = `${f.minute}'`;
      else if (f.time) display = f.time.substring(0,5);

      return {
        id: f.id || f.fixture_id || idx,
        kickoff: f.date || f.fixture_date || f.kickoff || `${date}T${f.time || "15:00:00"}Z`,
        time: f.time || f.fixture_date || f.kickoff || "",
        elapsed: f.minute || f.elapsed || 0,
        status: {
          status: isFinished ? "finished" : isHT ? "halftime" : statusRaw || "scheduled",
          short: statusShort || display,
          display: display,
          is_live: isLive || isHT,
          elapsed: f.minute || f.elapsed || 0
        },
        score: {
          halftime: { home: htHome, away: htAway },
          fulltime: { home: ftHome, away: ftAway },
          ht: { home: htHome, away: htAway },
          ft: { home: ftHome, away: ftAway }
        },
        home: {
          name: homeName,
          score: ftHome,
          ht_score: htHome,
          halftime: htHome
        },
        away: {
          name: awayName,
          score: ftAway,
          ht_score: htAway,
          halftime: htAway
        },
        League: {
          country: f.league?.country || f.country || "World",
          name: f.league?.name || f.league_name || f.competition || "League"
        },
        league: {
          country: f.league?.country || f.country || "World",
          name: f.league?.name || f.league_name || f.competition || "League"
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
