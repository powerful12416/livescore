export async function onRequestGet(context){
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];
  
  // YOUR REAL API - example with API-Football
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
    headers: { "x-apisports-key": context.env.API_KEY }
  });
  const json = await res.json();
  
  const matches = (json.response || []).map(f => ({
    id: f.fixture.id,
    kickoff: f.fixture.date,
    time: f.fixture.date,
    status: {
      status: f.fixture.status.short === "FT" ? "finished" : f.fixture.status.short,
      display: f.fixture.status.short,
      is_live: ["1H","2H","HT","ET","LIVE"].includes(f.fixture.status.short),
      elapsed: f.fixture.status.elapsed
    },
    // ADD HT + FT HERE - THIS IS THE FIX!
    score: {
      fulltime: f.goals,
      halftime: f.score.halftime,  // <-- THIS MAKES HT SHOW!
      ft: f.score.fulltime,
      ht: f.score.halftime
    },
    home: {
      name: f.teams.home.name,
      score: f.goals.home,
      ht_score: f.score.halftime.home,  // HT HOME
      halftime: f.score.halftime.home
    },
    away: {
      name: f.teams.away.name,
      score: f.goals.away,
      ht_score: f.score.halftime.away,  // HT AWAY
      halftime: f.score.halftime.away
    },
    League: {
      country: f.league.country,
      name: f.league.name
    },
    league: {
      country: f.league.country,
      name: f.league.name
    }
  }));
  
  return new Response(JSON.stringify({ data: { matches } }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
