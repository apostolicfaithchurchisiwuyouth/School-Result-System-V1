/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: api/aspfiy-webhook.js
 *
 * ASPFIY
 *   -> Vercel (this file): verifies x-wiaxy-signature
 *   -> Apps Script: action processVerifiedAspfiyWebhook
 *
 * CHANGES
 * - Timeout and maxDuration so the function cannot hang
 * - Logs every received notification (safe fields only)
 * - Apps Script failures are no longer reported to ASPFIY as
 *   success: if Apps Script says success:false, or returns a
 *   non-JSON page, this function returns an error status
 * - Whole handler wrapped so unexpected errors return JSON
 * ============================================================
 */

import crypto from 'crypto';

export const config = { maxDuration: 30 };

const APPS_SCRIPT_URL = process.env.SCHOOL_RESULTS_API_URL;
const WEBHOOK_TOKEN = process.env.ASPFIY_WEBHOOK_TOKEN;
const ASPFIY_SECRET_KEY = process.env.ASPFIY_SECRET_KEY;


export default async function handler(req, res) {

  try {
    return await mainHandler(req, res);
  } catch (error) {
    console.error('Unhandled webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook error: ' + String(error.message || error)
    });
  }

}


async function mainHandler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.'
    });
  }


  /* CONFIGURATION */

  if (!APPS_SCRIPT_URL) {
    console.error('Missing SCHOOL_RESULTS_API_URL.');
    return res.status(500).json({ success: false, error: 'Webhook service is not configured.' });
  }

  if (!WEBHOOK_TOKEN) {
    console.error('Missing ASPFIY_WEBHOOK_TOKEN.');
    return res.status(500).json({ success: false, error: 'Webhook service is not configured.' });
  }

  if (!ASPFIY_SECRET_KEY) {
    console.error('Missing ASPFIY_SECRET_KEY.');
    return res.status(500).json({ success: false, error: 'Webhook service is not configured.' });
  }


  /* SIGNATURE: x-wiaxy-signature must equal MD5(secret key) */

  const receivedSignature = String(
    req.headers['x-wiaxy-signature'] || ''
  ).trim().toLowerCase();

  if (!receivedSignature) {
    console.warn('ASPFIY webhook rejected: missing signature.');
    return res.status(401).json({ success: false, error: 'Missing webhook signature.' });
  }

  const expectedSignature = crypto
    .createHash('md5')
    .update(ASPFIY_SECRET_KEY)
    .digest('hex')
    .toLowerCase();

  let signaturesMatch = false;

  try {

    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (receivedBuffer.length === expectedBuffer.length) {
      signaturesMatch = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
    }

  } catch (error) {
    signaturesMatch = false;
  }

  if (!signaturesMatch) {
    console.warn('ASPFIY webhook rejected: invalid signature.');
    return res.status(401).json({ success: false, error: 'Invalid webhook signature.' });
  }


  /* BODY */

  let body = req.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid JSON payload.' });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid webhook payload.' });
  }

  const event = String(body.event || '').toUpperCase();
  const data = body.data;

  if (!data) {
    return res.status(400).json({ success: false, error: 'Webhook data is missing.' });
  }

  const transactionType = String(data.type || '').toUpperCase();

  /* Safe diagnostic log (no secrets) */
  console.log('ASPFIY webhook received:', JSON.stringify({
    event: event,
    type: transactionType,
    merchant_reference: data.merchant_reference || '',
    reference: data.reference || '',
    amount: data.amount || ''
  }));

  if (event !== 'PAYMENT_NOTIFICATION' && event !== 'PAYMENT_NOTIFIFICATION') {
    return res.status(200).json({ success: true, received: true, ignored: true });
  }

  if (transactionType !== 'RESERVED_ACCOUNT_TRANSACTION') {
    return res.status(200).json({ success: true, received: true, ignored: true });
  }


  /* FORWARD TO APPS SCRIPT (with timeout) */

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let responseText = '';
  let responseStatus = 0;

  try {

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'processVerifiedAspfiyWebhook',
        webhookToken: WEBHOOK_TOKEN,
        payload: body
      }),
      redirect: 'follow',
      signal: controller.signal
    });

    responseStatus = response.status;
    responseText = await response.text();

  } catch (error) {

    const timedOut = error.name === 'AbortError';

    console.error(
      timedOut ? 'Apps Script timed out.' : 'Webhook forwarding error:',
      error
    );

    return res.status(timedOut ? 504 : 502).json({
      success: false,
      error: timedOut
        ? 'The payment backend took too long to respond.'
        : 'Unable to contact the payment processor backend.'
    });

  } finally {
    clearTimeout(timer);
  }


  /* READ APPS SCRIPT RESULT */

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {

    console.error(
      'Apps Script returned non-JSON:',
      responseStatus,
      responseText.substring(0, 500)
    );

    return res.status(502).json({
      success: false,
      error: 'Payment notification could not be processed.'
    });
  }

  /*
   * Apps Script returns HTTP 200 even for its own errors, so the
   * success flag must be checked.
   */

  if (!result || result.success !== true) {

    console.error(
      'Apps Script rejected the payment notification:',
      JSON.stringify(result).substring(0, 1000)
    );

    return res.status(502).json({
      success: false,
      error: 'Payment notification could not be processed.',
      message: (result && (result.message || result.error)) || ''
    });
  }

  console.log('Apps Script processed webhook:', JSON.stringify(result).substring(0, 500));

  return res.status(200).json({
    success: true,
    received: true,
    processed: result.processed === true,
    duplicate: result.duplicate === true
  });
}
