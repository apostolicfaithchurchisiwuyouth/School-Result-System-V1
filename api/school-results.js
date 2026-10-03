/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /api/school-results.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Server-side proxy between the Vercel frontend and
 * Google Apps Script.
 *
 * FLOW:
 *
 * Browser
 *    ↓
 * /api/school-results
 *    ↓
 * Google Apps Script /exec
 *    ↓
 * Google Sheets
 *
 * This prevents the browser from making a direct request
 * to Google Apps Script and therefore avoids the Apps Script
 * CORS problem.
 * ============================================================
 */

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
   * ENVIRONMENT CHECK
   */
  if (!APPS_SCRIPT_URL) {
    console.error(
      'SCHOOL_RESULTS_API_URL is missing.'
    );

    return res.status(500).json({
      success: false,
      message: 'SCHOOL_RESULTS_API_URL is not configured.'
    });
  }

  /*
   * READ REQUEST
   */
  let requestBody = req.body;

  if (typeof requestBody === 'string') {
    try {
      requestBody = JSON.parse(requestBody);
    } catch (error) {

      console.error(
        'Request body JSON parse failed:',
        error
      );

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

  console.log(
    'Forwarding Apps Script action:',
    action
  );

  /*
   * CALL GOOGLE APPS SCRIPT
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

    console.error(
      'Apps Script fetch failed:',
      error
    );

    return res.status(502).json({
      success: false,
      message: 'Unable to connect to Google Apps Script.',
      diagnostic: String(error.message || error)
    });
  }

  /*
   * GET RAW RESPONSE
   */
  let responseText = '';

  try {

    responseText =
      await appsScriptResponse.text();

  } catch (error) {

    console.error(
      'Could not read Apps Script response:',
      error
    );

    return res.status(502).json({
      success: false,
      message: 'Could not read the Google Apps Script response.',
      diagnostic: String(error.message || error)
    });
  }

  console.log(
    'Apps Script HTTP status:',
    appsScriptResponse.status
  );

  console.log(
    'Apps Script content type:',
    appsScriptResponse.headers.get('content-type')
  );

  console.log(
    'Apps Script response:',
    responseText.substring(0, 3000)
  );

  /*
   * EMPTY RESPONSE
   */
  if (!responseText.trim()) {

    return res.status(502).json({
      success: false,
      message: 'Google Apps Script returned an empty response.',
      diagnostic: {
        httpStatus: appsScriptResponse.status,
        contentType:
          appsScriptResponse.headers.get('content-type')
      }
    });
  }

  /*
   * PARSE JSON
   */
  let result;

  try {

    result = JSON.parse(responseText);

  } catch (error) {

    /*
     * IMPORTANT:
     * Return the actual response for diagnosis.
     *
     * Do not expose secrets here.
     */
    return res.status(502).json({
      success: false,
      message:
        'Google Apps Script returned an invalid response.',

      diagnostic: {
        httpStatus: appsScriptResponse.status,

        contentType:
          appsScriptResponse.headers.get(
            'content-type'
          ),

        responsePreview:
          responseText.substring(0, 3000)
      }
    });
  }

  /*
   * FORWARD JSON RESPONSE
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
