/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/api.js
 * VERSION: 2.1.0
 *
 * PURPOSE:
 * Central API client for the entire School Results System.
 *
 * ARCHITECTURE:
 *
 * Browser
 *    ↓
 * /api/school-results
 *    ↓
 * Vercel API Proxy
 *    ↓
 * Google Apps Script
 *    ↓
 * Google Sheets
 *
 * IMPORTANT:
 * Frontend pages MUST NOT communicate directly with
 * Google Apps Script.
 * ============================================================
 */

(function () {
    'use strict';

    const API_ENDPOINT = '/api/school-results';

    /**
     * Create a unique request ID.
     */
    function createRequestId() {
        return (
            'REQ-' +
            Date.now() +
            '-' +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()
        );
    }

    /**
     * Remove sensitive values before browser logging.
     */
    function sanitizeForLog(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const safe = { ...data };

        [
            'password',
            'currentPassword',
            'newPassword',
            'secret',
            'secretKey',
            'apiKey',
            'token',
            'accessToken',
            'authorization'
        ].forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(safe, key)) {
                safe[key] = '[REDACTED]';
            }
        });

        return safe;
    }

    /**
     * Main API request function.
     *
     * Every frontend request should come through here.
     */
    async function apiRequest(action, data = {}) {
        const requestId = createRequestId();

        const requestBody = {
            ...data,
            action: action
        };

        console.log(
            `[API ${requestId}] → ${action}`,
            sanitizeForLog(requestBody)
        );

        let response;

        try {
            response = await fetch(API_ENDPOINT, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify(requestBody),

                cache: 'no-store',

                credentials: 'same-origin'
            });
        } catch (error) {
            console.error(
                `[API ${requestId}] Network error`,
                error
            );

            throw new Error(
                'Unable to connect to the School Results System. Please check your internet connection and try again.'
            );
        }

        let result;

        try {
            result = await response.json();
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
            `[API ${requestId}] ← ${action}`,
            result
        );

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                `Server error (${response.status}).`
            );
        }

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

        return result;
    }

    /**
     * Public API object.
     */
    window.schoolResultsAPI = {
        request: apiRequest,

        get: apiRequest,

        post: apiRequest
    };

    /**
     * Short alias.
     *
     * Existing pages can use:
     *
     * api.request(...)
     *
     * or
     *
     * api(...)
     *
     * during migration.
     */
    window.api = apiRequest;

})();
