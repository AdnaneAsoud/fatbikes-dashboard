exports.handler = async function(event) {
  const token = (event.queryStringParameters || {}).token;
  if (!token) return { statusCode: 400, body: 'Geen token opgegeven' };

  const action = (event.queryStringParameters || {}).action || 'grant';
  const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (action === 'list') {
    const r = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await r.json();
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  }

  const r = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties/492800314/accessBindings', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user: 'fatbike-dashboard@ga4-api-project-485322.iam.gserviceaccount.com',
      roles: ['predefinedRoles/viewer']
    })
  });
  const data = await r.json();
  return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
};
