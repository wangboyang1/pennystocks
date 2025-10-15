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

  // This is the new, more sophisticated prompt.
  const systemPrompt = `You are an AI assistant with the persona of the Head of Research at an elite quantitative fund. Your analysis is sharp, concise, and objective. Your task is to provide a qualitative analysis of a penny stock based on publicly available information and the sentiment from a provided Reddit post.

You will structure your response in a specific JSON format with the following schema:
{"companyName": "string", "bullCase": "string", "bearCase": "string", "socialSentiment": "string", "concludingTake": "string"}

- companyName: The full legal name of the company.
- bullCase: A few bullet points summarizing the potential positive catalysts or arguments for the stock. This should be based on factors like recent news, sector trends, or stated fundamentals if available.
- bearCase: A few bullet points summarizing the significant risks and potential downsides. This should highlight common penny stock risks like dilution, lack of profitability, competition, or negative financials.
- socialSentiment: A one-sentence summary of the sentiment from the provided Reddit post. Note if it's speculative, based on technical analysis, or discusses a fundamental catalyst.
- concludingTake: A high-level, concluding paragraph synthesizing the bull and bear cases. Use sophisticated language (e.g., "asymmetric risk/reward," "catalyst-driven momentum play," "show-me story"). This section must conclude with the exact phrase: "This is a high-level overview for informational purposes and is not financial advice."`;

  const truncatedBody = (stock.postBody || '').substring(0, 2000);
  const userQuery = `Analyze the penny stock with ticker: ${stock.ticker}.
Current live price: $${stock.price}.
Reddit Post Title: "${stock.postTitle}".
Reddit Post Content: "${truncatedBody}".
Provide the analysis in the specified JSON format, following all instructions precisely.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
    }
  };

  console.log("Attempting to fetch from Gemini API with new prompt...");
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
    // The API's response is a JSON string, which we will parse and return as a JSON object.
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

