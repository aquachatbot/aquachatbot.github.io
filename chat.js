// netlify/functions/chat.js
// Proxies requests to OpenAI — API key never reaches the browser.
//
// Deploy steps:
//   1. In Netlify dashboard → Site → Environment Variables → Add:
//        Key:   OPENAI_API_KEY
//        Value: sk-proj-...your key...
//   2. Redeploy. Done.

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    statusCode: response.status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
