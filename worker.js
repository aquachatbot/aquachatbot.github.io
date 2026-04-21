/**
 * Cloudflare Worker — Anthropic API Proxy
 * Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
 *
 * After deploying, add an Environment Variable:
 *   ANTHROPIC_API_KEY = sk-ant-...your key...
 *
 * Set your Worker URL in aqua_chat.html  →  PROXY_URL constant
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// ── Allowed origins (add your GitHub Pages URL here) ──────────
const ALLOWED_ORIGINS = [
  "https://aquachatbot.github.io",       // ← your GitHub Pages domain
  "http://localhost",                     // local testing
  "http://127.0.0.1",
  "null"                                  // file:// opened locally
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o))
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age":       "86400"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // ── Preflight ──────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Only accept POST /api/chat ─────────────────────────────
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
    }

    try {
      const body = await request.json();

      const anthropicRes = await fetch(ANTHROPIC_URL, {
        method:  "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });

      const data = await anthropicRes.json();

      return new Response(JSON.stringify(data), {
        status:  anthropicRes.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin)
        }
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Proxy error", detail: err.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }
  }
};