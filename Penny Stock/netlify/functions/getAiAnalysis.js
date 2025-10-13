{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // This secure function calls the Gemini AI API.\
// It uses an environment variable for the API key so it's never exposed to the public.\
\
exports.handler = async function(event, context) \{\
    // Only allow POST requests\
    if (event.httpMethod !== 'POST') \{\
        return \{ statusCode: 405, body: 'Method Not Allowed' \};\
    \}\
\
    try \{\
        const fetch = (await import('node-fetch')).default;\
        \
        // The GEMINI_API_KEY is securely stored in Netlify's environment variables\
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;\
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=$\{GEMINI_API_KEY\}`;\
\
        // Get the stock data sent from the frontend\
        const stockData = JSON.parse(event.body);\
\
        const systemPrompt = `You are a cautious financial analyst specializing in speculative penny stocks. Your analysis must be objective and highlight risks. For the given stock ticker, provide a structured JSON response with the following schema: \{"companyName": "string", "intrinsicValue": "string", "profitPossibility": "string", "sellingPoint": "number", "stopLoss": "number"\}.\
- First, analyze the provided 'Reddit Post Content' for any explicitly mentioned 'price target', 'PT', 'target price', or 'selling point'.\
- If a specific price is mentioned in the post, you MUST use that value for the 'sellingPoint' in your JSON response.\
- If no target is mentioned in the post, then generate your own plausible target price that is higher than the current price.\
- companyName: The full legal name of the company.\
- intrinsicValue: A brief, one-sentence analysis of its potential intrinsic value based on fundamentals, or lack thereof.\
- profitPossibility: A short-term profit outlook (e.g., 'Highly speculative, momentum-driven', 'High risk, catalyst dependent').\
- stopLoss: A plausible stop-loss price to manage downside risk, as a number. This MUST be lower than the current price.`;\
            \
        const truncatedBody = (stockData.postBody || '').substring(0, 2000);\
        const userQuery = `Analyze the penny stock with ticker: $\{stockData.ticker\}.\
Current live price: $$\{stockData.price\}.\
Reddit Post Title: "$\{stockData.postTitle\}".\
Reddit Post Content: "$\{truncatedBody\}".\
Provide the analysis in the specified JSON format, following all instructions.`;\
\
        const payload = \{\
            contents: [\{ parts: [\{ text: userQuery \}] \}],\
            systemInstruction: \{ parts: [\{ text: systemPrompt \}] \},\
            generationConfig: \{\
                responseMimeType: "application/json",\
            \}\
        \};\
\
        const response = await fetch(GEMINI_API_URL, \{\
            method: 'POST',\
            headers: \{ 'Content-Type': 'application/json' \},\
            body: JSON.stringify(payload)\
        \});\
\
        if (!response.ok) \{\
            throw new Error(`Gemini API responded with status: $\{response.status\}`);\
        \}\
\
        const result = await response.json();\
\
        return \{\
            statusCode: 200,\
            body: JSON.stringify(result),\
        \};\
\
    \} catch (error) \{\
        console.error("Gemini function error:", error);\
        return \{\
            statusCode: 500,\
            body: JSON.stringify(\{ error: 'AI analysis function failed.' \}),\
        \};\
    \}\
\};\
}