/**
 * AquaBot — Cloudflare Worker OpenAI Proxy
 *
 * HOW TO DEPLOY:
 * 1. Go to https://workers.cloudflare.com and create a free account
 * 2. Click "Create Worker", paste this entire file, click "Deploy"
 * 3. Go to Settings → Variables → Add a Secret:
 *      Name:  OPENAI_API_KEY
 *      Value: sk-proj-...  (your actual key)
 * 4. Copy your worker URL (e.g. https://aquabot-proxy.yourname.workers.dev)
 * 5. Paste it into index.html where it says WORKER_URL
 *
 * OPTIONAL — restrict to your domain only (recommended):
 *   Change ALLOWED_ORIGIN below to "https://aquachatbot.github.io"
 */

const ALLOWED_ORIGIN = "*"; // lock down to your domain in production

export default {
  async fetch(request, env) {
    // ── Handle CORS preflight ──────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    // ── Only accept POST ───────────────────────────────────────────
    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    // ── Parse incoming body ────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400,
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    // ── Forward to OpenAI ──────────────────────────────────────────
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await openaiRes.json();

    return new Response(JSON.stringify(data), {
      status: openaiRes.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(ALLOWED_ORIGIN),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
