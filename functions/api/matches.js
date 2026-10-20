export async function onRequest(context){
  try{
    const url = new URL(context.request.url);
    let date = url.searchParams.get("date");
    if(!date) date = new Date().toISOString().split('T')[0];
    
    const KEY = context.env.FOOTBALL_API_KEY;
    if(!KEY){
      return new Response(JSON.stringify([]),{
        headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
      });
    }

    // Your API provider
    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${KEY}&date=${date}&lang=en`;
    const r = await fetch(apiUrl);
    const j = await r.json();
    
    const raw = j.data || j.matches || j.result || [];
    
    // Normalize to clean format your beautiful frontend needs
    const clean = raw.map(m=>({
      league: m.league?.name || m.competition || m.leagueName || 'League',
      home: m.home_team || m.homeTeam?.name || m.home || m.teams?.home || 'Home',
      away: m.away_team || m.awayTeam?.name || m.away || m.teams?.away || 'Away',
      time: m.date || m.start_time || m.time || m.kickoff || date,
      status: m.status || m.state || m.match_status || 'FT',
      score: m.score || m.ft_score || (m.home_score!=null?`${m.home_score} - ${m.away_score}`:'0 - 0'),
      ht: m.ht_score || m.half_time || m.scoreHT || m.ht || '',
      ft: m.ft_score || m.score || '',
      homeScore: m.home_score,
      awayScore: m.away_score
    }));

    return new Response(JSON.stringify(clean),{
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=60"
      }
    });
  }catch(e){
    return new Response(JSON.stringify([]),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
}
