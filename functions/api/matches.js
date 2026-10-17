export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

  const API_KEY = context.env.API_FOOTBALL_KEY || context.env.API_KEY;
  
  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      error: "No API key set. Go Cloudflare Pages > Settings > Environment variables > Add API_FOOTBALL_KEY",
      data: { matches: [] } 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch real matches from API-Football
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: { 
        "x-apisports-key": API_KEY,
        "x-apisports-host": "v3.football.api-sports.io"
      }
    });
    
    const json = await res.json();
    
    if (!json.response || json.response.length === 0) {
      return new Response(JSON.stringify({ data: { matches: [] } }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const matches = json.response.map(f => {
      const statusShort = f.fixture.status.short;
      const isFinished = statusShort === "FT" || statusShort === "AET" || statusShort === "PEN";
      const isHT = statusShort === "HT";
      const isLive = ["1H","2H","ET","BT","LIVE","HT"].includes(statusShort);
      
      return {
        id: f.fixture.id,
        kickoff: f.fixture.date,
        time: f.fixture.date,
        elapsed: f.fixture.status.elapsed || 0,
        status: {
          status: isFinished ? "finished" : isHT ? "halftime" : statusShort,
          short: statusShort,
          display: statusShort === "FT" ? "FT" : isHT ? "HT" : f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : "",
          is_live: isLive,
          elapsed: f.fixture.status.elapsed || 0
        },
        // THIS MAKES HT SHOW!
        score: {
          halftime: f.score.halftime,  // {home, away}
          fulltime: f.score.fulltime,
          extratime: f.score.extratime,
          penalty: f.score.penalty,
          ft: f.score.fulltime,
          ht: f.score.halftime
        },
        home: {
          name: f.teams.home.name,
          logo: f.teams.home.logo,
          score: f.goals.home,
          ht_score: f.score.halftime.home,
          halftime: f.score.halftime.home,
          winner: f.teams.home.winner
        },
        away: {
          name: f.teams.away.name,
          logo: f.teams.away.logo,
          score: f.goals.away,
          ht_score: f.score.halftime.away,
          halftime: f.score.halftime.away,
          winner: f.teams.away.winner
        },
        League: {
          country: f.league.country,
          name: f.league.name,
          logo: f.league.logo,
          flag: f.league.flag
        },
        league: {
          country: f.league.country,
          name: f.league.name,
          logo: f.league.logo
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
