const APPS_SCRIPT_URL = process.env.SCHOOL_RESULTS_API_URL;

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  try {
    return await mainHandler(req, res);
  } catch (error) {
    console.error('Unhandled proxy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Proxy error: ' + String(error.message || error)
    });
  }
}

async function mainHandler(req, res) {

  const origin = req.headers.origin || '';

  if (origin === 'https://myschoolresultsystem.vercel.app') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  /* OPTIONS */
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  /* POST ONLY */
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  /* ENVIRONMENT */
  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      success: false,
      message: 'SCHOOL_RESULTS_API_URL is not configured.'
    });
  }

  /* READ BODY */
  let requestBody = req.body;

  if (typeof requestBody === 'string') {
    try {
      requestBody = JSON.parse(requestBody);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request JSON.'
      });
    }
  }

  if (
    !requestBody ||
    typeof requestBody !== 'object' ||
    Array.isArray(requestBody)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body.'
    });
  }

  const action = String(requestBody.action || '').trim();

  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'API action is required.'
    });
  }

  /* CALL APPS SCRIPT (with timeout) */
  let appsScriptResponse;
  let responseText = '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {

    appsScriptResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(requestBody),
      redirect: 'follow',
      signal: controller.signal
    });

    responseText = await appsScriptResponse.text();

  } catch (error) {

    const timedOut = error.name === 'AbortError';

    return res.status(timedOut ? 504 : 502).json({
      success: false,
      message: timedOut
        ? 'Google Apps Script took too long to respond.'
        : 'Unable to connect to Google Apps Script.',
      diagnostic: String(error.message || error)
    });

  } finally {
    clearTimeout(timer);
  }

  /* EMPTY RESPONSE */
  if (!responseText.trim()) {
    return res.status(502).json({
      success: false,
      message: 'Google Apps Script returned an empty response.',
      diagnostic: 'HTTP status: ' + appsScriptResponse.status
    });
  }

  /* PARSE JSON */
  let result;

  try {

    result = JSON.parse(responseText);

  } catch (error) {

    console.error(
      'Apps Script non-JSON:',
      appsScriptResponse.status,
      responseText.substring(0, 500)
    );

    return res.status(502).json({
      success: false,
      message: 'Google Apps Script returned an invalid response.',
      httpStatus: appsScriptResponse.status,
      contentType: appsScriptResponse.headers.get('content-type'),
      responsePreview: responseText.substring(0, 5000)
    });
  }

  /* FORWARD VALID JSON */
  return res.status(200).json(result);
}
