// This function securely fetches data from the Gemini API on the server.
exports.handler = async (event) => {
  console.log("getAiAnalysis function invoked.");

  if (event.httpMethod !== 'POST') {
    console.log("Method not allowed:", event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error("CRITICAL: GEMINI_API_KEY environment variable not found.");
    return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server. Please check Netlify environment variables.' }) };
  }
  console.log("API Key found successfully.");

  let stock;
  try {
    stock = JSON.parse(event.body).stock;
    if (!stock) throw new Error("'stock' object not found in request body.");
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }
  console.log("Received request for ticker:", stock.ticker);

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

  // This prompt matches the data structure expected by your index.html file.
  const systemPrompt = `You are a cautious financial analyst specializing in speculative penny stocks. Your analysis must be objective and highlight risks. For the given stock ticker, provide a structured JSON response with the following schema: {"companyName": "string", "intrinsicValue": "string", "profitPossibility": "string", "sellingPoint": "number", "stopLoss": "number"}.
- First, analyze the provided 'Reddit Post Content' for any explicitly mentioned 'price target', 'PT', 'target price', or 'selling point'.
- If a specific price is mentioned in the post, you MUST use that value for the 'sellingPoint' in your JSON response.
- If no target is mentioned in the post, then generate your own plausible target price that is higher than the current price.
- companyName: The full legal name of the company.
- intrinsicValue: A brief, one-sentence analysis of its potential intrinsic value based on fundamentals, or lack thereof.
- profitPossibility: A short-term profit outlook (e.g., 'Highly speculative, momentum-driven', 'High risk, catalyst dependent').
- stopLoss: A plausible stop-loss price to manage downside risk, as a number. This MUST be lower than the current price.`;

  const truncatedBody = (stock.postBody || '').substring(0, 2000);
  const userQuery = `Analyze the penny stock with ticker: ${stock.ticker}.
Current live price: $${stock.price}.
Reddit Post Title: "${stock.postTitle}".
Reddit Post Content: "${truncatedBody}".
Provide the analysis in the specified JSON format, following all instructions.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
    }
  };

  console.log("Attempting to fetch from Gemini API...");
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Gemini API response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error Response Body:', errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `Gemini API request failed. See function logs for details.` }) };
    }

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      console.error("Invalid AI response structure. Full response:", JSON.stringify(result));
      throw new Error("Invalid AI response structure from API.");
    }
    
    console.log("Successfully received and parsed AI analysis.");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonText 
    };

  } catch (error) {
    console.error('Catch block error in Serverless function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'An unexpected error occurred in the function. Check logs.' }) };
  }
};

