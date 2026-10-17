export async function onRequestGet(context) {
  try {
    const apikey = context.env.FOOTBALL_API_KEY || context.env.FOOTBALL_API_KEY;
    const url = new URL(context.request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!apikey) {
      return new Response(JSON.stringify({ data: { matches: [] }, error: "No API key set in Cloudflare env" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&date=${date}&lang=en`;
    const res = await fetch(apiUrl);
    const raw = await res.json();
    
    // live-football-api returns { data: [...] }
    const list = raw.data || raw.matches || raw || [];
    const fixtures = Array.isArray(list) ? list : [];

    const parse = (s) => {
      if (!s) return [0,0];
      const p = String(s).replace(' ', '').split('-');
      return [parseInt(p[0])||0, parseInt(p[1])||0];
    };

    const matches = fixtures.map((m,i)=>{
      const sc = m.scores || m.score || {};
      // Pro account: ht_score like "0 - 0", ft_score like "0 - 2"
      let [htH,htA] = parse(sc.ht_score || sc.ht || "");
      let [ftH,ftA] = parse(sc.ft_score || sc.score || sc.ft || "");
      
      // fallback to flat fields
      if(ftH===0 && ftA===0){
        ftH = Number(m.home_score ?? m.homeScore ?? 0);
        ftA = Number(m.away_score ?? m.awayScore ?? 0);
      }
      if(htH===0 && htA===0 && m.ht_score){
        [htH,htA] = parse(m.ht_score);
      }

      return {
        id: m.id || m.match_id || i,
        kickoff: m.date || m.time || `${date}T15:00:00Z`,
        time: m.time || "15:00",
        status: { status: m.status || "finished", display: "FT", short: "FT", is_live: false, elapsed: 90 },
        score: {
          halftime: { home: htH, away: htA },
          fulltime: { home: ftH, away: ftA },
          ht: { home: htH, away: htA },
          ft: { home: ftH, away: ftA }
        },
        home: { name: m.home_team || m.homeTeam || "Home", score: ftH, ht_score: htH },
        away: { name: m.away_team || m.awayTeam || "Away", score: ftA, ht_score: htA },
        ht: { home: htH, away: htA },
        halftime: `${htH} - ${htA}`,
        League: { country: m.country || "World", name: m.league_name || m.league || "League" },
        league: { country: m.country || "World", name: m.league_name || m.league || "League" }
      };
    });

    return new Response(JSON.stringify({ data: { matches } }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });

  } catch (e) {
    // NEVER return 500 - always return 200 with empty matches so frontend no show Error button
    return new Response(JSON.stringify({ data: { matches: [] }, error: e.message }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
