/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: api.js
 * VERSION: 2.0.0
 *
 * PURPOSE:
 * Central API client for the entire School Results System.
 *
 * IMPORTANT:
 * Frontend pages MUST NOT call the Google Apps Script URL
 * directly.
 *
 * All requests go through:
 *
 * Browser
 *   ↓
 * Vercel API Proxy
 *   ↓
 * Google Apps Script
 *   ↓
 * Google Sheets
 * ============================================================
 */

const SCHOOL_RESULTS_API = '/api/school-results';


/**
 * ============================================================
 * CENTRAL API REQUEST
 * ============================================================
 *
 * Usage:
 *
 * const result = await apiRequest('getStudents', {
 *   schoolId: schoolId
 * });
 *
 * ============================================================
 */
async function apiRequest(action, data = {}) {

    const requestId =
        'REQ-' +
        Date.now() +
        '-' +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    const requestBody = {
        ...data,
        action: action
    };


    console.log(
        `[API ${requestId}] → ${action}`,
        requestBody
    );


    let response;


    try {

        response = await fetch(
            SCHOOL_RESULTS_API,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify(
                    requestBody
                ),

                cache: 'no-store'
            }
        );

    } catch (error) {

        console.error(
            `[API ${requestId}] Network error:`,
            error
        );

        throw new Error(
            'Unable to connect to the School Results System. Please check your internet connection and try again.'
        );

    }


    let result;


    try {

        result =
            await response.json();

    } catch (error) {

        console.error(
            `[API ${requestId}] Invalid JSON response`,
            {
                status: response.status,
                statusText: response.statusText
            }
        );

        throw new Error(
            'The server returned an invalid response. Please try again.'
        );

    }


    console.log(
        `[API ${requestId}] ←`,
        result
    );


    /**
     * --------------------------------------------------------
     * HTTP ERROR
     * --------------------------------------------------------
     */

    if (!response.ok) {

        throw new Error(
            result.message ||
            result.error ||
            `Server error (${response.status}).`
        );

    }


    /**
     * --------------------------------------------------------
     * APPLICATION ERROR
     * --------------------------------------------------------
     */

    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.message ||
            result.error ||
            'The request could not be completed.'
        );

    }


    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return result;

}


/**
 * ============================================================
 * OPTIONAL SHORTCUT
 * ============================================================
 *
 * This allows:
 *
 * api.get(...)
 *
 * if you prefer a cleaner style.
 * ============================================================
 */

const api = {

    request: apiRequest,

    get: function(action, data = {}) {

        return apiRequest(
            action,
            data
        );

    }

};
 
