exports.handler = async function(event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Methode niet toegestaan' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Ongeldige JSON' }) };
  }

  const { apiKey, customerId, tel, stad, adres, bedrag } = body;

  if (!apiKey || !customerId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'API sleutel en klant-ID zijn verplicht' }) };
  }

  if (!tel || !stad) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Telefoon en stad zijn verplicht' }) };
  }

  const payload = {
    'parcel-phone':   tel,
    'parcel-city':    stad,
    'parcel-address': adres || stad,
    'parcel-price':   parseFloat(bedrag) || 0
  };

  try {
    const resp = await fetch(`https://api.ozonexpress.ma/customers/${customerId}/parcel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: CORS,
        body: JSON.stringify({ error: data.message || data.error || `OzonExpres fout: ${resp.status}`, details: data })
      };
    }

    const tracking = data['tracking-number'] || data.tracking_number || data.trackingNumber || data.barcode || data.id || null;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ tracking, data })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Verbinding met OzonExpres mislukt: ' + e.message })
    };
  }
};
