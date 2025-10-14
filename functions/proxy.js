// This function acts as a secure proxy to fetch data from external APIs
// without exposing them to CORS issues on the frontend.

exports.handler = async function(event, context) {
    // Get the URL to fetch from the query string parameter named 'quest'
    const targetUrl = event.queryStringParameters.quest;

    if (!targetUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Target URL is required.' }),
        };
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Fetch error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data.' }),
        };
    }
};
