export async function onRequest(context){
  try {
    let url = new URL(context.request.url);
    let date = url.searchParams.get("date");
    if(!date) date = new Date().toISOString().split("T")[0];

    const KEY = context.env.FOOTBALL_API_KEY;
    if(!KEY){
      return new Response(JSON.stringify([]),{
        headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
      });
    }

    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${KEY}&date=${date}&lang=en`;
    const r = await fetch(apiUrl);
    const d = await r.json();
    
    const raw = d.data || d.matches || d.result || [];

    // Normalize - NOW WITH HT SUPPORT
    const clean = raw.map((m)=>{
      // Try every possible HT field that API might send
      const htHome = m.home_score_ht ?? m.home_ht ?? m.ht_home ?? m.halftime_home ?? null;
      const htAway = m.away_score_ht ?? m.away_ht ?? m.ht_away ?? m.halftime_away ?? null;
      
      const ftHome = m.home_score ?? m.homeScore ?? 0;
      const ftAway = m.away_score ?? m.awayScore ?? 0;

      let htString = null;
      if(htHome !== null && htAway !== null){
        htString = `${htHome} - ${htAway}`;
      } else if(m.ht_score){
        htString = m.ht_score; // some APIs send "1 - 0" directly
      } else if(m.halftime_score){
        htString = m.halftime_score;
      }

      return {
        id: m.id || `${m.home_team}-${m.away_team}`,
        league: m.league?.name || m.competition || m.league_name || "League",
        home: m.home_team || m.homeTeam || m.home_name || "Home",
        away: m.away_team || m.awayTeam || m.away_name || "Away",
        country: m.country || "Europe",
        date: date,
        status: m.status || m.match_status || "LIVE",
        minute: m.minute || "",
        // FT
        score: `${ftHome} - ${ftAway}`,
        ft_score: `${ftHome} - ${ftAway}`,
        // HT - THIS FIXES YOUR YELLOW WARNING
        ht_score: htString,
        halftime: htString,
        homeScore: ftHome,
        awayScore: ftAway,
        home_score: ftHome,
        away_score: ftAway
      };
    });

    return new Response(JSON.stringify(clean),{
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=60"
      }
    });

  } catch(e){
    return new Response(JSON.stringify({error:e.message, data:[]}),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
}
