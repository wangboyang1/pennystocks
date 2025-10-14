{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // This function acts as a secure proxy to fetch data from external APIs\
// without exposing them to CORS issues on the frontend.\
\
exports.handler = async function(event, context) \{\
    // Get the URL to fetch from the query string parameter named 'quest'\
    const targetUrl = event.queryStringParameters.quest;\
\
    if (!targetUrl) \{\
        return \{\
            statusCode: 400,\
            body: JSON.stringify(\{ error: 'Target URL is required.' \}),\
        \};\
    \}\
\
    try \{\
        const fetch = (await import('node-fetch')).default;\
        const response = await fetch(targetUrl);\
        const data = await response.json();\
\
        return \{\
            statusCode: 200,\
            body: JSON.stringify(data),\
        \};\
    \} catch (error) \{\
        console.error("Fetch error:", error);\
        return \{\
            statusCode: 500,\
            body: JSON.stringify(\{ error: 'Failed to fetch data.' \}),\
        \};\
    \}\
\};\
}