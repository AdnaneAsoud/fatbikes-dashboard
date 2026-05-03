const crypto = require('crypto');

const CLIENT_EMAIL = 'fatbike-dashboard@ga4-api-project-485322.iam.gserviceaccount.com';
const PRIVATE_KEY  = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTem6D6J5o2J8L\nE1lDPFipxk4fOIEEw+bjQNT2NtcfFzumwPqAEZAJfHqUOyfyZH/K8bCK/oQXosYu\nUfteLDsLWEW9oLWNB+Oo0wsalVNymlfaCmJuOHhhmM81KnVpkyOffOAk2f3cKXun\nMGzp1Bv8tcetr/iIpLjPn9ZdLjx5WF80HmoX9AryyV0JV7Ke9rDgdqM5MDic/cMA\nmOKlcIBQD8/0GtoFHBbbAjMgmnsODeKLudPKB+mnI/1OogXQR2JEIMlR3pN+HMsn\nw6Bea+ItXQ2TB9K7jJrJ955UzjVY1pSK3RBZScqotvK3CH/tu77qG1Rej0UgfaQn\nDEypf5RhAgMBAAECggEAHqjx69rmWIILcOIhv1845YhUHC+neObkCw+DsJybzKyk\nH9V7m+Sv8sgix2naLUjHxEcNFuG2iey1+dI19N3Jw6fNGKR7ndJGfdv3EKgUnJlm\n4jw+MAes4E10wRsCQces0vsaTg1ywiAbhs49BBuV4SoDpJlOGZV0G9nrDMBe0SKs\nyrRe/OfXPxBX8iUoZ16NIw7pT10IfMTydJZjVe3W7hPj60+FPLGpCdu3XF9AOWGp\nEXXwpFh0GmHTlMalkiKptVT8LKkTDHf70NqXwdsoE2p9oRhtbpbmlkVVf9fOJE9M\nm04Be36TzSwIs0a0FbKL0OdeRmsqxC+ow7tI7YIilwKBgQDxq/D8WK0cf5Hx39iZ\nA12r56hjysLwKit4zQkImF4IsJ4JDzHPaN0irmIaiPGKberGGYrH7YzqB4BTX7nP\n0ty5w7twM2qidssyg61sAsWvx0FRDmEmDBaTjUBHeN5aDNUVUwi+0sugfTkmceXM\nShJz3DeBKRJFai09VgWjTaC7XwKBgQDgBDgbQN1WWGRmXdSoFQ756Kbmogb1AtIY\nXoNyT8BqcysUClX/hHisVHsY5l8ISp9xBGdhsb8BHCHCMVe4FzHkrdtwisVfFw15\n9Qa8dmfyVvN3/GzXJbSV3pDKNhgHewJ7jQ+V6C/cLSOtOSYBiNX9z0hbwyuSYYau\nCyeKlPmIPwKBgQCqeOQLzS2HncFAQetSvBoWSdnxUrTBnq19j/wgUQJ71MIVl99F\n9C2Q6juPhiwDvtdOF/RaZQnyh4oQxcSXgaFrdFNCqTI+Gdfp8RKizy3NeZtsZt1G\nbl56hLfj8rG+CbFBUoonuSAkPFDU+qDjwxhTG/MXK/aUenog+w4NDJQltwKBgC+N\ntbtTUaj6qpVwZawojD1Qvd1Hl+J67s5tgcnKVDZErGhcqVTMcjFi3Z6ziIjiDmaX\nYLrEWJ+LsT7f6pcRlW3N2j9RtgQxiJLTCNMI75fqDVTzKMejIWqPDH1gbkloO2au\n0xgnacF7c49aCk9ZFNQEJIAWNjGkskpP49zvMulRAoGAebBBzFw3CqjpUeBxLhLr\n8P0diADqqkZ3kmB+JBdjTL8EfZihhcF9s32FishrUCx5jBgWFWeAsGzVYdPHz1+0\nH6xBn+eAZp9u1qBbvveqZ+qltzCqr1Zen6LH0e4Tkiuvu+QblS/lKqKVjLs1jEbL\nqTYbhwwZJM03Wj5uwaBvJQ0=\n-----END PRIVATE KEY-----\n";
const PROPERTY_ID  = '492800314';

function b64url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = b64url(sign.sign(PRIVATE_KEY));
  const jwt = `${header}.${payload}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token fout: ' + JSON.stringify(data));
  return data.access_token;
}

async function report(token, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

exports.handler = async function() {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  try {
    const token = await getAccessToken();
    const [summary, pages, exits] = await Promise.all([
      report(token, {
        dateRanges: [{ startDate:'30daysAgo', endDate:'today' }],
        metrics: [{ name:'sessions' },{ name:'totalUsers' },{ name:'screenPageViews' },{ name:'bounceRate' }]
      }),
      report(token, {
        dateRanges: [{ startDate:'30daysAgo', endDate:'today' }],
        dimensions: [{ name:'pagePath' }],
        metrics: [{ name:'screenPageViews' }],
        orderBys: [{ metric:{ metricName:'screenPageViews' }, desc:true }],
        limit: 10
      }),
      report(token, {
        dateRanges: [{ startDate:'30daysAgo', endDate:'today' }],
        dimensions: [{ name:'pagePath' }],
        metrics: [{ name:'exits' }],
        orderBys: [{ metric:{ metricName:'exits' }, desc:true }],
        limit: 10
      })
    ]);
    return { statusCode:200, headers:CORS, body: JSON.stringify({ summary, pages, exits }) };
  } catch(e) {
    return { statusCode:500, headers:CORS, body: JSON.stringify({ error: e.message }) };
  }
};
