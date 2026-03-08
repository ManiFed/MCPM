const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const p = url.searchParams.get('p') || '50';
    const lev = url.searchParams.get('l') || '2';
    const ps = url.searchParams.get('ps') || '10';
    const sharpe = url.searchParams.get('sharpe') || '0.00';
    const ruin = url.searchParams.get('ruin') || '0.0';
    const median = url.searchParams.get('median') || '$10.0K';
    const title = url.searchParams.get('title') || 'Monte Carlo Simulation';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0d11;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f1318;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4ade80;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <!-- Grid pattern -->
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22c55e" stroke-width="0.3" opacity="0.08"/>
      </pattern>
      <rect width="1200" height="630" fill="url(#grid)"/>
      <!-- Top bar -->
      <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
      <!-- Logo -->
      <text x="60" y="70" fill="#22c55e" font-family="monospace" font-size="14" font-weight="700" letter-spacing="3">⟐ MCPM SIMULATOR</text>
      <!-- Title -->
      <text x="60" y="140" fill="#c5e8d0" font-family="monospace" font-size="28" font-weight="700">${escapeXml(title.slice(0, 50))}</text>
      <!-- Stats grid -->
      <rect x="60" y="180" width="240" height="120" rx="8" fill="#141922" stroke="#1e2530" stroke-width="1"/>
      <text x="80" y="210" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">PROBABILITY</text>
      <text x="80" y="270" fill="#22c55e" font-family="monospace" font-size="42" font-weight="700">${escapeXml(p)}%</text>
      
      <rect x="320" y="180" width="240" height="120" rx="8" fill="#141922" stroke="#1e2530" stroke-width="1"/>
      <text x="340" y="210" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">LEVERAGE</text>
      <text x="340" y="270" fill="#eab308" font-family="monospace" font-size="42" font-weight="700">${escapeXml(lev)}x</text>
      
      <rect x="580" y="180" width="240" height="120" rx="8" fill="#141922" stroke="#1e2530" stroke-width="1"/>
      <text x="600" y="210" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">POSITION</text>
      <text x="600" y="270" fill="#eab308" font-family="monospace" font-size="42" font-weight="700">${escapeXml(ps)}%</text>

      <rect x="840" y="180" width="240" height="120" rx="8" fill="#141922" stroke="#1e2530" stroke-width="1"/>
      <text x="860" y="210" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">SHARPE</text>
      <text x="860" y="270" fill="#c5e8d0" font-family="monospace" font-size="42" font-weight="700">${escapeXml(sharpe)}</text>

      <!-- Bottom stats -->
      <rect x="60" y="330" width="520" height="100" rx="8" fill="#141922" stroke="#1e2530" stroke-width="1"/>
      <text x="80" y="360" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">MEDIAN OUTCOME</text>
      <text x="80" y="410" fill="#22c55e" font-family="monospace" font-size="36" font-weight="700">${escapeXml(median)}</text>

      <rect x="600" y="330" width="480" height="100" rx="8" fill="#141922" stroke="${Number(ruin) > 10 ? '#ef4444' : '#1e2530'}" stroke-width="1"/>
      <text x="620" y="360" fill="#6b7280" font-family="monospace" font-size="11" letter-spacing="2">PROBABILITY OF RUIN</text>
      <text x="620" y="410" fill="${Number(ruin) > 10 ? '#ef4444' : '#22c55e'}" font-family="monospace" font-size="36" font-weight="700">${escapeXml(ruin)}%</text>

      <!-- Footer -->
      <text x="60" y="560" fill="#374151" font-family="monospace" font-size="12" letter-spacing="1">Monte Carlo Prediction Market Simulator</text>
      <text x="60" y="585" fill="#374151" font-family="monospace" font-size="11">kalshi.lovable.app</text>
    </svg>`;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
