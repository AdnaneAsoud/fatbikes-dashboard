exports.handler = async function(event) {
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 400, body: 'Geen token' };

  const resp = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties/492800314/accessBindings', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: 'fatbike-dashboard@ga4-api-project-485322.iam.gserviceaccount.com',
      roles: ['predefinedRoles/viewer']
    })
  });
  const data = await resp.json();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
};
