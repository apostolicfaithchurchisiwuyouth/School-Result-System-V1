/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/index.js
 * VERSION: 2.1.0
 *
 * PURPOSE:
 * Login page controller.
 *
 * API communication is handled ONLY by /js/api.js.
 * ============================================================
 */

(function () {
    'use strict';

    const SESSION_KEY =
        'school_results_system_session_v1';

    const DASHBOARD_URL =
        '/app/dashboard.html';

    const LOGIN_PAGE =
        '/index.html';

    /* --------------------------------------------------------
       DOM ELEMENTS
    -------------------------------------------------------- */

    const loginForm =
        document.getElementById('loginForm');

    const emailInput =
        document.getElementById('email');

    const passwordInput =
        document.getElementById('password');

    const togglePasswordButton =
        document.getElementById('togglePassword');

    const loginButton =
        document.getElementById('loginButton');

    const loginSpinner =
        document.getElementById('loginSpinner');

    const loginMessage =
        document.getElementById('loginMessage');

    const registerButton =
        document.getElementById('registerButton');


    /* --------------------------------------------------------
       INITIALIZE
    -------------------------------------------------------- */

    function initialize() {

        const session =
            getStoredSession();

        if (
            session &&
            session.schoolId
        ) {
            window.location.replace(
                DASHBOARD_URL
            );

            return;
        }

        setupPasswordToggle();
        setupLoginForm();
        setupRegisterButton();
    }


    /* --------------------------------------------------------
       LOGIN
    -------------------------------------------------------- */

    async function handleLogin(event) {

        event.preventDefault();

        clearMessage();

        const email =
            String(
                emailInput?.value || ''
            ).trim();

        const password =
            String(
                passwordInput?.value || ''
            );

        if (!email) {
            showError(
                'Please enter your email address.'
            );

            emailInput?.focus();

            return;
        }

        if (!isValidEmail(email)) {
            showError(
                'Please enter a valid email address.'
            );

            emailInput?.focus();

            return;
        }

        if (!password) {
            showError(
                'Please enter your password.'
            );

            passwordInput?.focus();

            return;
        }

        setLoading(true);

        try {

            /**
             * IMPORTANT:
             * No direct Apps Script URL here.
             */
            const result =
                await window.schoolResultsAPI.request(
                    'login',
                    {
                        email: email,
                        password: password
                    }
                );

            const loginData =
                extractLoginData(result);

            if (!loginData) {
                throw new Error(
                    'Login was successful, but no account information was returned.'
                );
            }

            const session =
                buildSession(loginData);

            if (!session.schoolId) {
                throw new Error(
                    'Your school account could not be identified. Please contact support.'
                );
            }

            saveSession(session);

            showSuccess(
                'Login successful. Redirecting...'
            );

            window.setTimeout(function () {
                window.location.replace(
                    DASHBOARD_URL
                );
            }, 200);

        } catch (error) {

            console.error(
                'Login error:',
                error
            );

            showError(
                getErrorMessage(error)
            );

        } finally {

            setLoading(false);
        }
    }


    /* --------------------------------------------------------
       RESPONSE EXTRACTION
    -------------------------------------------------------- */

    function extractLoginData(result) {

        if (!result) {
            return null;
        }

        if (
            result.user &&
            typeof result.user === 'object'
        ) {
            return result.user;
        }

        if (
            result.data &&
            result.data.user &&
            typeof result.data.user === 'object'
        ) {
            return result.data.user;
        }

        if (
            result.data &&
            typeof result.data === 'object' &&
            !Array.isArray(result.data)
        ) {
            return result.data;
        }

        if (
            typeof result === 'object' &&
            (
                result.schoolId ||
                result['School ID']
            )
        ) {
            return result;
        }

        return null;
    }


    /* --------------------------------------------------------
       SESSION
    -------------------------------------------------------- */

    function buildSession(user) {

        return {
            userId:
                user.userId ??
                user.id ??
                user['User ID'] ??
                '',

            schoolId:
                user.schoolId ??
                user['School ID'] ??
                '',

            fullName:
                user.fullName ??
                user.name ??
                user['Full Name'] ??
                '',

            email:
                user.email ??
                user['Email'] ??
                '',

            role:
                user.role ??
                user['Role'] ??
                'Admin',

            schoolName:
                user.schoolName ??
                user['School Name'] ??
                '',

            status:
                user.status ??
                user['Status'] ??
                'Active',

            loginAt:
                new Date().toISOString()
        };
    }


    function saveSession(session) {

        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );
    }


    function getStoredSession() {

        try {

            const raw =
                localStorage.getItem(
                    SESSION_KEY
                );

            if (!raw) {
                return null;
            }

            const session =
                JSON.parse(raw);

            if (
                !session ||
                typeof session !== 'object'
            ) {
                return null;
            }

            return session;

        } catch (error) {

            console.error(
                'Unable to read stored session:',
                error
            );

            localStorage.removeItem(
                SESSION_KEY
            );

            return null;
        }
    }


    function logout() {

        localStorage.removeItem(
            SESSION_KEY
        );

        window.location.replace(
            LOGIN_PAGE
        );
    }


    /* --------------------------------------------------------
       PASSWORD TOGGLE
    -------------------------------------------------------- */

    function setupPasswordToggle() {

        if (!togglePasswordButton) {
            return;
        }

        togglePasswordButton.addEventListener(
            'click',
            function () {

                const isPassword =
                    passwordInput.type === 'password';

                passwordInput.type =
                    isPassword
                        ? 'text'
                        : 'password';

                togglePasswordButton.setAttribute(
                    'aria-label',
                    isPassword
                        ? 'Hide password'
                        : 'Show password'
                );
            }
        );
    }


    /* --------------------------------------------------------
       FORM SETUP
    -------------------------------------------------------- */

    function setupLoginForm() {

        if (!loginForm) {
            return;
        }

        loginForm.addEventListener(
            'submit',
            handleLogin
        );
    }


    function setupRegisterButton() {

        if (!registerButton) {
            return;
        }

        registerButton.addEventListener(
            'click',
            function () {

                window.location.href =
                    '/register.html';
            }
        );
    }


    /* --------------------------------------------------------
       LOADING
    -------------------------------------------------------- */

    function setLoading(isLoading) {

        if (loginButton) {

            loginButton.disabled =
                isLoading;
        }

        if (loginSpinner) {

            loginSpinner.hidden =
                !isLoading;
        }

        if (isLoading) {

            loginButton?.setAttribute(
                'aria-busy',
                'true'
            );

        } else {

            loginButton?.removeAttribute(
                'aria-busy'
            );
        }
    }


    /* --------------------------------------------------------
       MESSAGES
    -------------------------------------------------------- */

    function showError(message) {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.className =
            'login-message error';

        loginMessage.hidden = false;
    }


    function showSuccess(message) {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.className =
            'login-message success';

        loginMessage.hidden = false;
    }


    function clearMessage() {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent = '';

        loginMessage.hidden = true;

        loginMessage.className =
            'login-message';
    }


    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);
    }


    function getErrorMessage(error) {

        if (
            error &&
            typeof error.message === 'string' &&
            error.message.trim()
        ) {
            return error.message;
        }

        return (
            'Unable to log in at the moment. Please try again.'
        );
    }


    /* --------------------------------------------------------
       GLOBAL LOGOUT
    -------------------------------------------------------- */

    window.schoolResultsLogout =
        logout;


    /* --------------------------------------------------------
       START
    -------------------------------------------------------- */

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );

    } else {

        initialize();
    }

})();
