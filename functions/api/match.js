export async function onRequest(context) {
  // Live matches API - returns JSON
  const matches = [
    {
      id: 1,
      league: "Premier League",
      home: "Man City",
      away: "Arsenal",
      homeScore: 2,
      awayScore: 1,
      minute: "78'",
      status: "LIVE",
      live: true
    },
    {
      id: 2,
      league: "Premier League",
      home: "Liverpool",
      away: "Chelsea",
      homeScore: 1,
      awayScore: 1,
      minute: "62'",
      status: "LIVE",
      live: true
    },
    {
      id: 3,
      league: "La Liga",
      home: "Real Madrid",
      away: "Barcelona",
      homeScore: 0,
      awayScore: 0,
      minute: "15:00",
      status: "SCHEDULED",
      live: false
    },
    {
      id: 4,
      league: "Serie A",
      home: "Inter",
      away: "AC Milan",
      homeScore: 2,
      awayScore: 2,
      minute: "54'",
      status: "LIVE",
      live: true
    },
    {
      id: 5,
      league: "Bundesliga",
      home: "Bayern Munich",
      away: "Dortmund",
      homeScore: 1,
      awayScore: 0,
      minute: "19:30",
      status: "SCHEDULED",
      live: false
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    count: matches.length,
    timestamp: new Date().toISOString(),
    matches: matches
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30"
    }
  });
}
