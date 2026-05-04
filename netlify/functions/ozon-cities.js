exports.handler = async function(event) {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const { apiKey, customerId } = event.queryStringParameters || {};

  if (!apiKey || !customerId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'API sleutel en klant-ID verplicht' }) };
  }

  try {
    const resp = await fetch(
      `https://api.ozonexpress.ma/customers/${customerId}/${apiKey}/get-cities`
    );
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
