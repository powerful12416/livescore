export async function onRequestGet(context) {
  // TEST DATA with HT and FT - to prove your HTML works
  const matches = [
    {
      id: 1,
      kickoff: "2026-10-17T15:00:00Z",
      status: { status: "finished", display: "FT", short: "FT", is_live: false },
      score: {
        halftime: { home: 0, away: 0 },
        fulltime: { home: 0, away: 2 },
        ht: { home: 0, away: 0 },
        ft: { home: 0, away: 2 }
      },
      home: { name: "Everton", score: 0, ht_score: 0 },
      away: { name: "Chelsea", score: 2, ht_score: 0 },
      ht: { home: 0, away: 0 },
      halftime: "0 - 0",
      League: { country: "England", name: "Premier League" },
      league: { country: "England", name: "Premier League" }
    },
    {
      id: 2,
      kickoff: "2026-10-17T17:30:00Z",
      status: { status: "finished", display: "FT", short: "FT", is_live: false },
      score: {
        halftime: { home: 1, away: 1 },
        fulltime: { home: 2, away: 1 },
        ht: { home: 1, away: 1 },
        ft: { home: 2, away: 1 }
      },
      home: { name: "Arsenal", score: 2, ht_score: 1 },
      away: { name: "Man City", score: 1, ht_score: 1 },
      ht: { home: 1, away: 1 },
      halftime: "1 - 1",
      League: { country: "England", name: "Premier League" },
      league: { country: "England", name: "Premier League" }
    }
  ];

  return new Response(JSON.stringify({ data: { matches } }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
