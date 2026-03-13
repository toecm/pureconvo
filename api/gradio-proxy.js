// api/gradio-proxy.js
import { client } from "@gradio/client";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, args } = req.body;

  try {
    // 1. Authenticate with the PRIVATE Hugging Face Space using the Vercel secret
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("Server configuration error: HF_TOKEN missing");

    const app = await client("toecm/PureVersation", {
      hf_token: hfToken
    });

    // 2. Forward the request to the Space
    const result = await app.predict(endpoint, args || []);

    // 3. Send the result back to the React frontend
    return res.status(200).json(result);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
