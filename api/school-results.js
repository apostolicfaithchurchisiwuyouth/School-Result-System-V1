/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /api/school-results.js
 * VERSION: 2.0.0
 *
 * PURPOSE:
 * Central Vercel API proxy.
 *
 * FLOW:
 *
 * Browser
 *   ↓
 * /api/school-results
 *   ↓
 * Google Apps Script
 *   ↓
 * Google Sheets
 *
 * IMPORTANT:
 * The Google Apps Script URL must NEVER be placed
 * directly in frontend JavaScript.
 * ============================================================
 */


/**
 * Google Apps Script Web App URL.
 *
 * Store this in Vercel Environment Variables as:
 *
 * SCHOOL_RESULTS_API_URL
 */
const APPS_SCRIPT_URL =
    process.env.SCHOOL_RESULTS_API_URL;


/**
 * Allow enough time for Apps Script.
 *
 * IMPORTANT:
 * The timeout below is intentionally lower than
 * the maximum Vercel function duration.
 *
 * This prevents requests from hanging forever.
 */
const REQUEST_TIMEOUT = 55000;


/**
 * ============================================================
 * MAIN HANDLER
 * ============================================================
 */
export default async function handler(req, res) {

    const requestId =
        'PROXY-' +
        Date.now() +
        '-' +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    try {

        return await handleRequest(
            req,
            res,
            requestId
        );

    } catch (error) {

        console.error(
            `[${requestId}] UNHANDLED PROXY ERROR`,
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'An unexpected server error occurred.',

            requestId:
                requestId

        });

    }

}


/**
 * ============================================================
 * REQUEST HANDLER
 * ============================================================
 */
async function handleRequest(
    req,
    res,
    requestId
) {


    /**
     * --------------------------------------------------------
     * CORS
     * --------------------------------------------------------
     */

    const origin =
        req.headers.origin || '';


    if (
        origin ===
        'https://myschoolresultsystem.vercel.app'
    ) {

        res.setHeader(
            'Access-Control-Allow-Origin',
            origin
        );

        res.setHeader(
            'Vary',
            'Origin'
        );

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
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );


    /**
     * --------------------------------------------------------
     * OPTIONS
     * --------------------------------------------------------
     */

    if (
        req.method === 'OPTIONS'
    ) {

        return res
            .status(204)
            .end();

    }


    /**
     * --------------------------------------------------------
     * POST ONLY
     * --------------------------------------------------------
     */

    if (
        req.method !== 'POST'
    ) {

        return res.status(405).json({

            success: false,

            message:
                'Method not allowed.',

            requestId:
                requestId

        });

    }


    /**
     * --------------------------------------------------------
     * ENVIRONMENT VARIABLE
     * --------------------------------------------------------
     */

    if (
        !APPS_SCRIPT_URL
    ) {

        console.error(
            `[${requestId}] SCHOOL_RESULTS_API_URL is missing.`
        );


        return res.status(500).json({

            success: false,

            message:
                'School Results API is not configured.',

            requestId:
                requestId

        });

    }


    /**
     * --------------------------------------------------------
     * READ REQUEST BODY
     * --------------------------------------------------------
     */

    let requestBody =
        req.body;


    if (
        typeof requestBody ===
        'string'
    ) {

        try {

            requestBody =
                JSON.parse(
                    requestBody
                );

        } catch (error) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid request JSON.',

                requestId:
                    requestId

            });

        }

    }


    /**
     * --------------------------------------------------------
     * VALIDATE BODY
     * --------------------------------------------------------
     */

    if (
        !requestBody ||
        typeof requestBody !== 'object' ||
        Array.isArray(requestBody)
    ) {

        return res.status(400).json({

            success: false,

            message:
                'Invalid request body.',

            requestId:
                requestId

        });

    }


    /**
     * --------------------------------------------------------
     * ACTION
     * --------------------------------------------------------
     */

    const action =
        String(
            requestBody.action || ''
        ).trim();


    if (!action) {

        return res.status(400).json({

            success: false,

            message:
                'API action is required.',

            requestId:
                requestId

        });

    }


    console.log(
        `[${requestId}] → Apps Script: ${action}`
    );


    /**
     * --------------------------------------------------------
     * CALL APPS SCRIPT
     * --------------------------------------------------------
     */

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );


    let appsScriptResponse;

    let responseText = '';


    const startTime =
        Date.now();


    try {

        appsScriptResponse =
            await fetch(
                APPS_SCRIPT_URL,
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'text/plain;charset=utf-8',

                        'Accept':
                            'application/json'

                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),

                    redirect:
                        'follow',

                    signal:
                        controller.signal

                }
            );


        responseText =
            await appsScriptResponse.text();


    } catch (error) {

        const timedOut =
            error &&
            error.name ===
            'AbortError';


        const duration =
            Date.now() -
            startTime;


        console.error(
            `[${requestId}] Apps Script request failed after ${duration}ms`,
            error
        );


        return res.status(
            timedOut
                ? 504
                : 502
        ).json({

            success: false,

            message:
                timedOut

                    ? 'The server took too long to respond. Please try again.'

                    : 'Unable to connect to the School Results API.',

            requestId:
                requestId,

            duration:
                duration

        });

    } finally {

        clearTimeout(
            timer
        );

    }


    const duration =
        Date.now() -
        startTime;


    console.log(
        `[${requestId}] Apps Script responded in ${duration}ms`
    );


    /**
     * --------------------------------------------------------
     * EMPTY RESPONSE
     * --------------------------------------------------------
     */

    if (
        !responseText ||
        !responseText.trim()
    ) {

        console.error(
            `[${requestId}] Empty Apps Script response. HTTP ${appsScriptResponse.status}`
        );


        return res.status(502).json({

            success: false,

            message:
                'The School Results API returned an empty response.',

            requestId:
                requestId,

            httpStatus:
                appsScriptResponse.status,

            duration:
                duration

        });

    }


    /**
     * --------------------------------------------------------
     * PARSE JSON
     * --------------------------------------------------------
     */

    let result;


    try {

        result =
            JSON.parse(
                responseText
            );

    } catch (error) {

        console.error(
            `[${requestId}] Apps Script returned non-JSON:`,
            responseText.substring(
                0,
                1000
            )
        );


        return res.status(502).json({

            success: false,

            message:
                'The School Results API returned an invalid response.',

            requestId:
                requestId,

            httpStatus:
                appsScriptResponse.status,

            contentType:
                appsScriptResponse.headers.get(
                    'content-type'
                ),

            responsePreview:
                responseText.substring(
                    0,
                    1000
                )

        });

    }


    /**
     * --------------------------------------------------------
     * FORWARD RESPONSE
     * --------------------------------------------------------
     */

    return res.status(200).json({

        ...result,

        requestId:
            result.requestId ||
            requestId

    });

}
 
