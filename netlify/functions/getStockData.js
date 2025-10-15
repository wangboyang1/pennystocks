// This function securely fetches data from Yahoo Finance on the server.
exports.handler = async (event) => {
  const { ticker } = event.queryStringParameters;
  if (!ticker) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker parameter is required.' }) };
  }

  const YFINANCE_URL = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`;

  try {
    const response = await fetch(YFINANCE_URL);
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify(null) };
    }
    const data = await response.json();
    
    // Process data on the server before sending it back
    const result = data?.chart?.result?.[0];
    if (!result || !result.meta || !result.indicators.quote?.[0]?.close) {
        return { statusCode: 200, body: JSON.stringify(null) };
    }
    
    const meta = result.meta;
    const prices = result.indicators.quote[0].close;
    const currentPrice = meta.regularMarketPrice;

    if (currentPrice === undefined || prices.length === 0) {
        return { statusCode: 200, body: JSON.stringify(null) };
    }

    const calcChange = (oldPrice) => {
        if (oldPrice === null || oldPrice === 0) return 'N/A';
        return (((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2);
    };

    const stockData = {
        price: currentPrice.toFixed(4),
        isUp: currentPrice >= (meta.previousClose || currentPrice),
        change1d: calcChange(prices[prices.length - 2]),
        change5d: calcChange(prices[prices.length - 6]),
        change1mo: calcChange(prices[prices.length - 22]),
        change1y: calcChange(prices[0]),
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stockData),
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${ticker}:`, error);
    return { statusCode: 500, body: JSON.stringify(null) };
  }
};
