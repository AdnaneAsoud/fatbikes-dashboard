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
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Ongeldige JSON' }) }; }

  const { apiKey, customerId, receiver, tel, cityId, adres, bedrag, stock } = body;

  if (!apiKey || !customerId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'API sleutel en klant-ID zijn verplicht' }) };
  }
  if (!receiver || !tel || !cityId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Naam, telefoon en stad zijn verplicht' }) };
  }

  const form = new FormData();
  form.append('parcel-receiver', receiver);
  form.append('parcel-phone',    tel);
  form.append('parcel-city',     String(cityId));
  form.append('parcel-address',  adres || '');
  form.append('parcel-price',    String(parseFloat(bedrag) || 0));
  form.append('parcel-stock',    '0');

  try {
    const resp = await fetch(
      `https://api.ozonexpress.ma/customers/${customerId}/${apiKey}/add-parcel`,
      { method: 'POST', body: form }
    );

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      return { statusCode: resp.status, headers: CORS, body: JSON.stringify({ error: `OzonExpres fout: ${resp.status}`, details: data }) };
    }

    const tracking = data?.['ADD-PARCEL']?.['NEW-PARCEL']?.['TRACKING-NUMBER']
      || data?.['ADD-PARCEL']?.BARCODE
      || data?.['ADD-PARCEL']?.['TRACKING-NUMBER']
      || null;

    const result = data?.['ADD-PARCEL']?.RESULT || null;
    if (result === 'ERROR') {
      const msg = data?.['ADD-PARCEL']?.MESSAGE || 'Onbekende fout';
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: msg, details: data }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ tracking, data }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Verbinding mislukt: ' + e.message }) };
  }
};
