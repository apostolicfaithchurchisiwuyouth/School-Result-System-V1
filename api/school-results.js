const APPS_SCRIPT_URL = process.env.SCHOOL_RESULTS_API_URL;

export default async function handler(req, res) {

  const origin = req.headers.origin || '';

  if (origin === 'https://myschoolresultsystem.vercel.app') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate'
  );

  /*
   * OPTIONS
   */
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  /*
   * POST ONLY
   */
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  /*
   * ENVIRONMENT
   */
  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      success: false,
      message: 'SCHOOL_RESULTS_API_URL is not configured.'
    });
  }

  /*
   * READ BODY
   */
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

  const action = String(
    requestBody.action || ''
  ).trim();

  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'API action is required.'
    });
  }

  /*
   * CALL APPS SCRIPT
   */
  let appsScriptResponse;

  try {

    appsScriptResponse = await fetch(
      APPS_SCRIPT_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },

        body: JSON.stringify(requestBody),

        redirect: 'follow'
      }
    );

  } catch (error) {

    return res.status(502).json({
      success: false,
      message: 'Unable to connect to Google Apps Script.',
      diagnostic: String(
        error.message || error
      )
    });
  }

  /*
   * READ RESPONSE
   */
  let responseText = '';

  try {

    responseText =
      await appsScriptResponse.text();

  } catch (error) {

    return res.status(502).json({
      success: false,
      message:
        'Could not read the Google Apps Script response.',
      diagnostic: String(
        error.message || error
      )
    });
  }

  /*
   * IF EMPTY
   */
  if (!responseText.trim()) {

    return res.status(502).json({
      success: false,

      message:
        'Google Apps Script returned an empty response.',

      diagnostic:
        'HTTP status: ' +
        appsScriptResponse.status
    });
  }

  /*
   * TRY JSON
   */
  let result;

  try {

    result = JSON.parse(responseText);

  } catch (error) {

    /*
     * RETURN THE ACTUAL RESPONSE DIRECTLY
     * SO WE CAN SEE WHAT APPS SCRIPT SENT.
     */
    return res.status(502).json({

      success: false,

      message:
        'Google Apps Script returned an invalid response.',

      httpStatus:
        appsScriptResponse.status,

      contentType:
        appsScriptResponse.headers.get(
          'content-type'
        ),

      responsePreview:
        responseText.substring(0, 5000)
    });
  }

  /*
   * FORWARD VALID JSON
   */
  return res
    .status(
      appsScriptResponse.status >= 200 &&
      appsScriptResponse.status <= 599
        ? appsScriptResponse.status
        : 502
    )
    .json(result);
}



const text = await upstream.text();
console.error('Apps Script status:', upstream.status, '| body:', text.substring(0, 500));
