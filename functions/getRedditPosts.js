// This function securely fetches data from Reddit on the server.
exports.handler = async (event) => {
  // Get the original Reddit URL from the query parameter
  const { url } = event.queryStringParameters;
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL parameter is required.' }) };
  }

  try {
    // Use a standard, browser-like User-Agent to prevent being blocked by Reddit.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Reddit API Fetch Error:", errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Reddit: ${response.statusText}` }) };
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Serverless Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};