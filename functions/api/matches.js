export async function onRequest(context) {
  const envKey = context.env.FOOTBALL_API_KEY;
  const hardKey = "0bdde243a2a70a0beec84e06428e9b1357b906da3f74ef94ddb69472bb60c0a5";
  const finalKey = envKey || hardKey;
  
  return new Response(JSON.stringify({
    hasKey: !!finalKey,
    hasEnvKey: !!envKey,
    usingHardcoded: !envKey,
    keyLength: finalKey.length,
    time: new Date().toISOString()
  }), { headers: { "Content-Type": "application/json" } });
}
