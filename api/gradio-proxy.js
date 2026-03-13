// api/gradio-proxy.js
// 🟢 FIX: Removed the static import at the top of the file

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, args } = req.body;

  try {
    // 🟢 FIX: Dynamic Import to solve the Vercel ERR_REQUIRE_ESM crash
    const { client, handle_file } = await import("@gradio/client");

    // 2. Authenticate securely using the Vercel secret
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("Server configuration error: HF_TOKEN missing");

    const app = await client("toecm/PureVersation", {
      hf_token: hfToken
    });

    // 3. SMART FILE DETECTION
    const processedArgs = (args || []).map(arg => {
        if (typeof arg === 'string' && arg.startsWith('data:')) {
            return handle_file(arg);
        }
        return arg;
    });

    const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // 4. Forward the request to the Private Space
    const result = await app.predict(safeEndpoint, processedArgs);

    // 5. Send the result back to the React frontend
    return res.status(200).json(result);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
