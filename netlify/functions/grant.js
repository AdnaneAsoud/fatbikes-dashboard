const https = require('https');

function httpsGet(options) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 500, body: e.message }));
    req.end();
  });
}

function httpsPost(options, body) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 500, body: e.message }));
    req.write(body);
    req.end();
  });
}

exports.handler = async function(event) {
  const token = (event.queryStringParameters || {}).token;
  if (!token) return { statusCode: 400, body: 'Geen token opgegeven' };

  const action = (event.queryStringParameters || {}).action || 'grant';

  if (action === 'list') {
    // List all accounts to find correct property
    const result = await httpsGet({
      hostname: 'analyticsadmin.googleapis.com',
      path: '/v1beta/accountSummaries',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: result.body };
  }

  // Grant access
  const body = JSON.stringify({
    user: 'fatbike-dashboard@ga4-api-project-485322.iam.gserviceaccount.com',
    roles: ['predefinedRoles/viewer']
  });

  const result = await httpsPost({
    hostname: 'analyticsadmin.googleapis.com',
    path: '/v1beta/properties/492800314/accessBindings',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);

  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: `Status: ${result.status}\n\n${result.body}` };
};
