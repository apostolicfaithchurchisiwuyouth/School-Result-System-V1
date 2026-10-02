/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: api/aspfiy-webhook.js
 *
 * PURPOSE:
 * Secure ASPFIY webhook receiver.
 *
 * FLOW:
 *
 * ASPFIY
 *   ↓
 * Vercel
 *   ↓
 * Verify x-wiaxy-signature
 *   ↓
 * Forward verified notification to Google Apps Script
 *
 * SECURITY:
 * - ASPFIY secret is stored in Vercel Environment Variables.
 * - Secret is NEVER sent to the browser.
 * - Only verified ASPFIY requests are forwarded.
 * ============================================================
 */

import crypto from 'crypto';


/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const APPS_SCRIPT_URL =
  process.env.SCHOOL_RESULTS_API_URL;

const WEBHOOK_TOKEN =
  process.env.ASPFIY_WEBHOOK_TOKEN;

const ASPFIY_SECRET_KEY =
  process.env.ASPFIY_SECRET_KEY;


/**
 * ============================================================
 * METHOD
 * ============================================================
 */

export default async function handler(req, res) {

  /**
   * ASPFIY should send POST requests.
   */
  if (req.method !== 'POST') {

    return res.status(405).json({

      success: false,

      error:
        'Method not allowed.'

    });

  }


  /**
   * ==========================================================
   * CHECK CONFIGURATION
   * ==========================================================
   */

  if (!APPS_SCRIPT_URL) {

    console.error(
      'Missing SCHOOL_RESULTS_API_URL.'
    );

    return res.status(500).json({

      success: false,

      error:
        'Webhook service is not configured.'

    });

  }


  if (!WEBHOOK_TOKEN) {

    console.error(
      'Missing ASPFIY_WEBHOOK_TOKEN.'
    );

    return res.status(500).json({

      success: false,

      error:
        'Webhook service is not configured.'

    });

  }


  if (!ASPFIY_SECRET_KEY) {

    console.error(
      'Missing ASPFIY_SECRET_KEY.'
    );

    return res.status(500).json({

      success: false,

      error:
        'Webhook service is not configured.'

    });

  }


  /**
   * ==========================================================
   * READ ASPFIY SIGNATURE
   * ==========================================================
   *
   * ASPFIY documents:
   *
   * x-wiaxy-signature
   *
   * The value should equal:
   *
   * MD5(secret key)
   */
  const receivedSignature =
    String(
      req.headers[
        'x-wiaxy-signature'
      ] || ''
    )
      .trim()
      .toLowerCase();


  if (!receivedSignature) {

    console.warn(
      'ASPFIY webhook rejected: missing signature.'
    );

    return res.status(401).json({

      success: false,

      error:
        'Missing webhook signature.'

    });

  }


  /**
   * ==========================================================
   * CALCULATE EXPECTED SIGNATURE
   * ==========================================================
   */

  const expectedSignature =
    crypto
      .createHash('md5')
      .update(
        ASPFIY_SECRET_KEY
      )
      .digest('hex')
      .toLowerCase();


  /**
   * ==========================================================
   * TIMING-SAFE COMPARISON
   * ==========================================================
   */

  let signaturesMatch =
    false;


  try {

    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        'utf8'
      );


    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        'utf8'
      );


    if (
      receivedBuffer.length ===
      expectedBuffer.length
    ) {

      signaturesMatch =
        crypto.timingSafeEqual(
          receivedBuffer,
          expectedBuffer
        );

    }

  } catch (error) {

    signaturesMatch =
      false;

  }


  if (!signaturesMatch) {

    console.warn(
      'ASPFIY webhook rejected: invalid signature.'
    );

    return res.status(401).json({

      success: false,

      error:
        'Invalid webhook signature.'

    });

  }


  /**
   * ==========================================================
   * READ BODY
   * ==========================================================
   */

  let body =
    req.body;


  /**
   * Vercel may provide the body as a string depending on
   * request content type.
   */
  if (
    typeof body === 'string'
  ) {

    try {

      body =
        JSON.parse(
          body
        );

    } catch (error) {

      return res.status(400).json({

        success: false,

        error:
          'Invalid JSON payload.'

      });

    }

  }


  if (
    !body ||
    typeof body !== 'object'
  ) {

    return res.status(400).json({

      success: false,

      error:
        'Invalid webhook payload.'

    });

  }


  /**
   * ==========================================================
   * BASIC PAYLOAD VALIDATION
   * ==========================================================
   */

  const event =
    String(
      body.event || ''
    ).toUpperCase();


  const data =
    body.data;


  if (!data) {

    return res.status(400).json({

      success: false,

      error:
        'Webhook data is missing.'

    });

  }


  const transactionType =
    String(
      data.type || ''
    ).toUpperCase();


  /**
   * Ignore unrelated ASPFIY notifications safely.
   */
  if (
    event !==
      'PAYMENT_NOTIFICATION'
    &&
    event !==
      'PAYMENT_NOTIFIFICATION'
  ) {

    return res.status(200).json({

      success: true,

      received: true,

      ignored: true

    });

  }


  if (
    transactionType !==
    'RESERVED_ACCOUNT_TRANSACTION'
  ) {

    return res.status(200).json({

      success: true,

      received: true,

      ignored: true

    });

  }


  /**
   * ==========================================================
   * FORWARD VERIFIED WEBHOOK TO APPS SCRIPT
   * ==========================================================
   *
   * We do NOT send the ASPFIY secret key.
   *
   * Instead we send an internal shared token.
   */
  try {

    const response =
      await fetch(
        APPS_SCRIPT_URL,
        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json'

          },

          body:
            JSON.stringify({

              action:
                'processVerifiedAspfiyWebhook',

              webhookToken:
                WEBHOOK_TOKEN,

              payload:
                body

            })

        }
      );


    const responseText =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(
          responseText
        );

    } catch (error) {

      result = {

        success:
          response.ok,

        raw:
          responseText

      };

    }


    if (!response.ok) {

      console.error(
        'Apps Script webhook processing failed:',
        result
      );

      return res.status(502).json({

        success: false,

        error:
          'Payment notification could not be processed.'

      });

    }


    return res.status(200).json({

      success: true,

      received: true,

      processed:
        result.success === true,

      result:
        result

    });


  } catch (error) {

    console.error(
      'Webhook forwarding error:',
      error
    );


    return res.status(502).json({

      success: false,

      error:
        'Unable to contact the payment processor backend.'

    });

  }

}
