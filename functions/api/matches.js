export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || "2026-10-17";

  // TRY REAL API IF YOU HAVE KEY, ELSE SHOW DEMO DATA WITH HT + FT
  let matches = [];

  try {
    // If you have API-Football key in Cloudflare env, it will use it
    const apiKey = context.env.API_FOOTBALL_KEY || context.env.API_KEY;
    if (apiKey) {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const j = await r.json();
      if (j.response && j.response.length > 0) {
        matches = j.response.map(f => ({
          id: f.fixture.id,
          kickoff: f.fixture.date,
          time: f.fixture.date,
          status: {
            status: f.fixture.status.short === "FT" ? "finished" : f.fixture.status.short,
            display: f.fixture.status.short,
            is_live: ["1H","2H","HT","LIVE"].includes(f.fixture.status.short),
            elapsed: f.fixture.status.elapsed || 0
          },
          score: {
            halftime: f.score.halftime,
            fulltime: f.score.fulltime,
            ht: f.score.halftime,
            ft: f.score.fulltime
          },
          home: {
            name: f.teams.home.name,
            score: f.goals.home,
            ht_score: f.score.halftime.home,
            halftime: f.score.halftime.home
          },
          away: {
            name: f.teams.away.name,
            score: f.goals.away,
            ht_score: f.score.halftime.away,
            halftime: f.score.halftime.away
          },
          League: { country: f.league.country, name: f.league.name },
          league: { country: f.league.country, name: f.league.name }
        }));
      }
    }
  } catch(e) {}

  // FALLBACK DEMO DATA WITH HT + FT - This makes your site show matches even without API key!
  if (matches.length === 0) {
    matches = [
      { id:1, kickoff:`${date}T14:00:00Z`, time:`${date}T14:00:00Z`, status:{status:"finished",display:"FT",elapsed:0}, score:{halftime:{home:1,away:0},fulltime:{home:2,away:0},ht:{home:1,away:0}}, home:{name:"Everton",score:0,ht_score:0,halftime:0}, away:{name:"Chelsea",score:2,ht_score:1,halftime:1}, League:{country:"England",name:"Premier League"}, league:{country:"England",name:"Premier League"} },
      { id:2, kickoff:`${date}T16:30:00Z`, time:`${date}T16:30:00Z`, status:{status:"finished",display:"FT",elapsed:0}, score:{halftime:{home:0,away:1},fulltime:{home:1,away:2},ht:{home:0,away:1}}, home:{name:"Arsenal",score:1,ht_score:0,halftime:0}, away:{name:"Liverpool",score:2,ht_score:1,halftime:1}, League:{country:"England",name:"Premier League"}, league:{country:"England",name:"Premier League"} },
      { id:3, kickoff:`${date}T18:45:00Z`, time:`${date}T18:45:00Z`, status:{status:"FT",display:"FT",elapsed:0}, score:{halftime:{home:2,away:1},fulltime:{home:4,away:3},ht:{home:2,away:1}}, home:{name:"Elversberg",score:4,ht_score:2,halftime:2}, away:{name:"Hertha Berlin",score:3,ht_score:1,halftime:1}, League:{country:"Germany",name:"2. Bundesliga"}, league:{country:"Germany",name:"2. Bundesliga"} },
      { id:4, kickoff:`${date}T19:00:00Z`, time:`${date}T19:00:00Z`, status:{status:"1H",display:"48'",is_live:true,elapsed:48}, score:{halftime:{home:0,away:0},ht:{home:0,away:0}}, home:{name:"PSG",score:1,ht_score:0}, away:{name:"Marseille",score:0,ht_score:0}, League:{country:"France",name:"Ligue 1"}, league:{country:"France",name:"Ligue 1"} },
      { id:5, kickoff:`${date}T19:00:00Z`, time:`${date}T19:00:00Z`, status:{status:"HT",display:"HT",elapsed:45}, score:{halftime:{home:1,away:1},ht:{home:1,away:1}}, home:{name:"Barcelona",score:1,ht_score:1}, away:{name:"Real Madrid",score:1,ht_score:1}, League:{country:"Spain",name:"LaLiga"}, league:{country:"Spain",name:"LaLiga"} },
      { id:6, kickoff:`${date}T20:45:00Z`, time:`${date}T20:45:00Z`, status:{status:"NS",display:"",elapsed:0}, home:{name:"Bayern Munich",score:null}, away:{name:"Dortmund",score:null}, League:{country:"Germany",name:"Bundesliga"}, league:{country:"Germany",name:"Bundesliga"} }
    ];
  }

  return new Response(JSON.stringify({ data: { matches } }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
