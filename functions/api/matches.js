export async function onRequestGet(c){
const k=c.env.FOOTBALL_API_KEY||c.env.LIVE_FOOTBALL_API_KEY||c.env.APISPORT_KEY;
const date=new URL(c.request.url).searchParams.get('date')||new Date().toISOString().split('T')[0];
if(!k)return new Response(JSON.stringify({data:{matches:[]},error:"NO KEY"}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
try{
// CORRECT apisport.online endpoint
let res=await fetch(`https://api.apisport.online/api/v1/fixtures?date=${date}`,{
headers:{Authorization:`Bearer ${k}`,"x-api-key":k}
});
let j=await res.json();
// Try fixtures list
let list=j.fixtures||j.data?.fixtures||j.data||[];

// If empty, try live
if(!list.length){
let live=await fetch(`https://api.apisport.online/api/v1/fixtures/live`,{
headers:{Authorization:`Bearer ${k}`,"x-api-key":k}
});
let lj=await live.json();
list=lj.fixtures||lj.data?.fixtures||lj.data||[];
}

const ms=list.map((f,i)=>{
let h=f.teams?.home?.name||f.home_team||"Home";
let a=f.teams?.away?.name||f.away_team||"Away";
let ftH=f.goals?.home??f.score?.fulltime?.home??0;
let ftA=f.goals?.away??f.score?.fulltime?.away??0;
let htH=f.score?.halftime?.home??0;
let htA=f.score?.halftime?.away??0;
return{
id:f.fixture?.id||f.id||i,
home:{name:h,score:ftH,ht_score:htH},
away:{name:a,score:ftA,ht_score:htA},
ht:{home:htH,away:htA},
league:{country:f.league?.country||"World",name:f.league?.name||"League"}
};
});
return new Response(JSON.stringify({data:{matches:ms}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-store"}});
}catch(e){
return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
}
