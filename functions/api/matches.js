export async function onRequestGet(context) {
  const apikey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&date=${date}&lang=en`;

  const res = await fetch(apiUrl);
  const raw = await res.json();
  const list = raw.data || [];

  const parse = (s) => {
    if (!s) return [0,0];
    const p = String(s).split('-');
    return [parseInt(p[0])||0, parseInt(p[1])||0];
  };

  const matches = list.map((m,i)=>{
    const sc = m.scores || {};
    let [htH,htA] = parse(sc.ht_score);
    let [ftH,ftA] = parse(sc.ft_score || sc.score);
    if(ftH===0 && ftA===0){ ftH=m.home_score||0; ftA=m.away_score||0; }

    return {
      id: m.id||i,
      kickoff: m.date,
      status: { status: "finished", display: "FT", short: "FT", is_live: false },
      score: {
        halftime: { home: htH, away: htA },
        fulltime: { home: ftH, away: ftA },
        ht: { home: htH, away: htA },
        ft: { home: ftH, away: ftA }
      },
      home: { name: m.home_team, score: ftH, ht_score: htH },
      away: { name: m.away_team, score: ftA, ht_score: htA },
      ht: { home: htH, away: htA },
      halftime: `${htH} - ${htA}`,
      League: { country: m.country, name: m.league_name },
      league: { country: m.country, name: m.league_name }
    };
  });

  return new Response(JSON.stringify({ data: { matches } }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
  });
}
