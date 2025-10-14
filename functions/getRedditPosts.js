// This function securely fetches data from Reddit on the server.
exports.handler = async (event) => {
  // Get the original Reddit URL from the query parameter
  const { url } = event.queryStringParameters;
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL parameter is required.' }) };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: `Failed to fetch from Reddit: ${response.statusText}` }) };
    }
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
