export async function onRequestGet(c){
const k=c.env.FOOTBALL_API_KEY||c.env.LIVE_FOOTBALL_API_KEY||c.env.APISPORT_KEY;
const d=new URL(c.request.url).searchParams.get('date')||new Date().toISOString().split('T')[0];
if(!k)return new Response(JSON.stringify({data:{matches:[]},error:"NO KEY"}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
try{
const u=`https://apisport.online/api/v1/matches?api_key=${k}&date=${d}`;
const r=await fetch(u,{headers:{"x-api-key":k}});
const j=await r.json();
const list=j.data?.matches||j.data||j.matches||[];
const p=s=>{if(!s)return[0,0];let a=String(s).split('-');return[parseInt(a[0])||0,parseInt(a[1])||0]};
const ms=list.map((m,i)=>{
let htH=0,htA=0,ftH=0,ftA=0;
let sc=m.scores||m.score||{};
if(sc.ht){htH=sc.ht.home||0;htA=sc.ht.away||0}else if(sc.ht_score){[htH,htA]=p(sc.ht_score)}else if(m.ht_score){[htH,htA]=p(m.ht_score)}
if(sc.ft){ftH=sc.ft.home||0;ftA=sc.ft.away||0}else if(sc.ft_score){[ftH,ftA]=p(sc.ft_score)}else if(m.ft_score){[ftH,ftA]=p(m.ft_score)}else{ftH=m.home_score||0;ftA=m.away_score||0}
return{id:m.id||i,home:{name:m.home_team||m.home?.name||"Home",score:ftH,ht_score:htH},away:{name:m.away_team||m.away?.name||"Away",score:ftA,ht_score:htA},ht:{home:htH,away:htA},league:{country:m.country||"World",name:m.league_name||"League"}}});
return new Response(JSON.stringify({data:{matches:ms}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-store"}});
}catch(e){return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})}
}
