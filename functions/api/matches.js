export async function onRequestGet(context) {
  const apikey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!apikey) {
    return new Response(JSON.stringify({ success: false, data: { matches: [] } }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }

  const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&date=${date}&lang=en`;

  try {
    const res = await fetch(apiUrl);
    const raw = await res.json();

    // live-football-api.com returns { data: [...] } or { matches: [...] }
    const rawList = raw.data || raw.matches || raw.response || [];
    const fixtures = Array.isArray(rawList) ? rawList : (rawList.data || []);

    // Helper to parse "0 - 2" string
    const parseScoreStr = (s) => {
      if (!s) return [0, 0];
      const p = String(s).split('-');
      if (p.length === 2) return [parseInt(p[0].trim()) || 0, parseInt(p[1].trim()) || 0];
      return [0, 0];
    };

    const matches = fixtures.map((m, i) => {
      const scores = m.scores || {};

      // HT - try all possible fields your API fit use
      let htHome = 0, htAway = 0;
      if (scores.ht_score) [htHome, htAway] = parseScoreStr(scores.ht_score);
      else if (m.ht_score) [htHome, htAway] = parseScoreStr(m.ht_score);
      else if (m.scores?.halftime) { htHome = m.scores.halftime.home ?? 0; htAway = m.scores.halftime.away ?? 0; }
      else if (m.home_score_ht !== undefined) { htHome = m.home_score_ht; htAway = m.away_score_ht; }

      // FT - try all possible fields
      let ftHome = 0, ftAway = 0;
      if (scores.ft_score) [ftHome, ftAway] = parseScoreStr(scores.ft_score);
      else if (scores.score) [ftHome, ftAway] = parseScoreStr(scores.score);
      else if (m.ft_score) [ftHome, ftAway] = parseScoreStr(m.ft_score);
      else { ftHome = m.home_score ?? m.goals_home ?? 0; ftAway = m.away_score ?? m.goals_away ?? 0; }

      return {
        id: m.id || m.match_id || i,
        kickoff: m.date || `${date}T15:00:00Z`,
        time: m.time || "15:00",
        status: {
          status: m.status || "finished",
          display: m.status || "FT",
          short: m.status || "FT",
          is_live: false,
          elapsed: 0
        },
        score: {
          halftime: { home: htHome, away: htAway },
          fulltime: { home: ftHome, away: ftAway },
          ht: { home: htHome, away: htAway },
          ft: { home: ftHome, away: ftAway }
        },
        home: {
          name: m.home_team || m.home_name || "Home",
          score: ftHome,
          ht_score: htHome
        },
        away: {
          name: m.away_team || m.away_name || "Away",
          score: ftAway,
          ht_score: htAway
        },
        League: {
          country: m.country || m.league?.country || "England",
          name: m.league_name || m.league?.name || "Premier League"
        },
        league: {
          country: m.country || m.league?.country || "England",
          name: m.league_name || m.league?.name || "Premier League"
        }
      };
    });

    return new Response(JSON.stringify({ data: { matches } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
