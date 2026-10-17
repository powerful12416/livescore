export async function onRequestGet(context) {
  const apikey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!apikey) {
    return new Response(JSON.stringify({ success: false, data: { matches: [] } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&date=${date}&lang=en`;

  try {
    const res = await fetch(apiUrl);
    const raw = await res.json();
    const list = raw.data || raw.matches || [];
    const parse = (s) => {
      if (!s) return [0,0];
      const p = String(s).split('-');
      return [parseInt(p[0])||0, parseInt(p[1])||0];
    };
    const matches = list.map((m,i)=>{
      const sc = m.scores || {};
      let [htH,htA]=parse(sc.ht_score);
      let [ftH,ftA]=parse(sc.ft_score||sc.score);
      if(ftH===0 && ftA===0){ftH=m.home_score||0;ftA=m.away_score||0;}
      return {
        id: m.id||i,
        kickoff: m.date||`${date}T15:00:00Z`,
        status:{status:m.status||"finished",display:m.status||"FT",short:"FT",is_live:false},
        score:{
          halftime:{home:htH,away:htA},
          fulltime:{home:ftH,away:ftA},
          ht:{home:htH,away:htA},
          ft:{home:ftH,away:ftA}
        },
        home:{name:m.home_team||"Home",score:ftH,ht_score:htH},
        away:{name:m.away_team||"Away",score:ftA,ht_score:htA},
        League:{country:m.country||"England",name:m.league_name||"Premier League"},
        league:{country:m.country||"England",name:m.league_name||"Premier League"}
      };
    });
    return new Response(JSON.stringify({data:{matches}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch (e) {
    return new Response(JSON.stringify({success:false,error:e.message,data:{matches:[]}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
