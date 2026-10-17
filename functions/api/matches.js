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

    // raw.data or raw.matches - depend on your plan
    const list = raw.data || raw.matches || raw.response || raw || [];
    const fixtures = Array.isArray(list) ? list : (list.data || list.matches || []);

    const matches = fixtures.map((m, i) => {
      // Parse HT and FT
      // Your API can return as string "0 - 1" or as object
      let htHome = 0, htAway = 0, ftHome = 0, ftAway = 0;

      const scores = m.scores || m.score || {};
      
      // If ht_score is "0 - 0"
      const parseScore = (str) => {
        if (!str) return [0,0];
        if (typeof str === 'object') return [str.home ?? 0, str.away ?? 0];
        const parts = String(str).split("-");
        if (parts.length === 2) return [parseInt(parts[0])||0, parseInt(parts[1])||0];
        return [0,0];
      };

      if (scores.ht_score) [htHome, htAway] = parseScore(scores.ht_score);
      else if (m.ht_score) [htHome, htAway] = parseScore(m.ht_score);
      else if (m.home_score_ht !== undefined) { htHome = m.home_score_ht; htAway = m.away_score_ht; }

      if (scores.ft_score) [ftHome, ftAway] = parseScore(scores.ft_score);
      else if (scores.score) [ftHome, ftAway] = parseScore(scores.score);
      else if (m.ft_score) [ftHome, ftAway] = parseScore(m.ft_score);
      else { ftHome = m.home_score ?? m.goals_home ?? 0; ftAway = m.away_score ?? m.goals_away ?? 0; }

      return {
        id: m.id || m.match_id || i,
        kickoff: m.date || m.kickoff || `${date}T15:00:00Z`,
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
        home: { name: m.home_team || m.home_name || m.teams?.home?.name || "Home", score: ftHome, ht_score: htHome },
        away: { name: m.away_team || m.away_name || m.teams?.away?.name || "Away", score: ftAway, ht_score: htAway },
        League: { country: m.country || m.league?.country || "England", name: m.league_name || m.league?.name || "Premier League" },
        league: { country: m.country || m.league?.country || "England", name: m.league_name || m.league?.name || "Premier League" },
        // Keep original scores for debug
        _original_scores: scores
      };
    });

    return new Response(JSON.stringify({ data: { matches } }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message, data: { matches: [] } }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
