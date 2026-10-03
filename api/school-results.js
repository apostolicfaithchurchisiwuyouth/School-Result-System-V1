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

  /*
   * ----------------------------------------------------------
   * CORS
   * ----------------------------------------------------------
   * The production frontend is same-origin with this endpoint,
   * but these headers make the endpoint behave correctly if
   * the browser sends an OPTIONS request.
   * ----------------------------------------------------------
   */

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
   * ----------------------------------------------------------
   * OPTIONS
   * ----------------------------------------------------------
   */

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  /*
   * ----------------------------------------------------------
   * ONLY POST IS ALLOWED
   * ----------------------------------------------------------
   */

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  /*
   * ----------------------------------------------------------
   * CHECK ENVIRONMENT VARIABLE
   * ----------------------------------------------------------
   */

  if (!APPS_SCRIPT_URL) {
    console.error(
      'SCHOOL_RESULTS_API_URL environment variable is missing.'
    );

    return res.status(500).json({
      success: false,
      message: 'School results server configuration is incomplete.'
    });
  }

  /*
   * ----------------------------------------------------------
   * READ REQUEST BODY
   * ----------------------------------------------------------
   */

  let requestBody = req.body;

  if (typeof requestBody === 'string') {
    try {
      requestBody = JSON.parse(requestBody);
    } catch (error) {
      console.error('Could not parse request body:', error);

      return res.status(400).json({
        success: false,
        message: 'Invalid request data.'
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
      message: 'A valid request body is required.'
    });
  }

  /*
   * ----------------------------------------------------------
   * REQUIRE ACTION
   * ----------------------------------------------------------
   */

  const action = String(requestBody.action || '').trim();

  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'API action is required.'
    });
  }

  /*
   * ----------------------------------------------------------
   * FORWARD REQUEST TO GOOGLE APPS SCRIPT
   * ----------------------------------------------------------
   *
   * We deliberately use text/plain here.
   *
   * This matches the existing frontend request style and
   * avoids unnecessary browser preflight behaviour.
   * ----------------------------------------------------------
   */

  let appsScriptResponse;

  try {

    appsScriptResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },

      body: JSON.stringify(requestBody)
    });

  } catch (error) {

    console.error(
      'Unable to reach Google Apps Script:',
      error
    );

    return res.status(502).json({
      success: false,
      message: 'Unable to connect to the school results server.'
    });
  }

  /*
   * ----------------------------------------------------------
   * READ APPS SCRIPT RESPONSE
   * ----------------------------------------------------------
   *
   * Read as text first because Apps Script responses can
   * occasionally be returned through redirects or with an
   * unexpected content type.
   * ----------------------------------------------------------
   */

  let responseText = '';

  try {
    responseText = await appsScriptResponse.text();
  } catch (error) {

    console.error(
      'Unable to read Apps Script response:',
      error
    );

    return res.status(502).json({
      success: false,
      message: 'The school results server returned an unreadable response.'
    });
  }

  /*
   * ----------------------------------------------------------
   * PARSE JSON
   * ----------------------------------------------------------
   */

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {

    console.error(
      'Apps Script returned non-JSON response:',
      responseText.substring(0, 1000)
    );

    return res.status(502).json({
      success: false,
      message: 'The school results server returned an invalid response.'
    });
  }

  /*
   * ----------------------------------------------------------
   * FORWARD RESPONSE
   * ----------------------------------------------------------
   *
   * Preserve the Apps Script HTTP status when possible.
   * ----------------------------------------------------------
   */

  const statusCode =
    appsScriptResponse.status >= 200 &&
    appsScriptResponse.status <= 599
      ? appsScriptResponse.status
      : 502;

  return res.status(statusCode).json(result);
}
