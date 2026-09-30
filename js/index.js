/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: index.js
   VERSION: 1.0.0

   PURPOSE:
   Main login and frontend session management.
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';


/*
 * This is the single session key that the
 * entire frontend application will use.
 */
const SESSION_KEY =
    'school_results_system_session_v1';


/*
 * Dashboard destination after successful login.
 *
 * We will create this page in the next phase.
 */
const DASHBOARD_URL =
    '/app/dashboard.html';


/* ============================================================
   DOM
============================================================ */

const loginForm =
    document.getElementById('loginForm');

const emailInput =
    document.getElementById('email');

const passwordInput =
    document.getElementById('password');

const togglePassword =
    document.getElementById('togglePassword');

const loginButton =
    document.getElementById('loginButton');

const loginButtonText =
    document.getElementById('loginButtonText');

const loginSpinner =
    document.getElementById('loginSpinner');

const loginMessage =
    document.getElementById('loginMessage');

const emailError =
    document.getElementById('emailError');

const passwordError =
    document.getElementById('passwordError');

const registerButton =
    document.getElementById('registerButton');


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initialize
);


function initialize() {

    /*
     * If a valid session already exists,
     * don't show the login form again.
     */
    const existingSession =
        getStoredSession();


    if (
        existingSession &&
        existingSession.schoolId
    ) {

        window.location.href =
            DASHBOARD_URL;

        return;
    }


    bindEvents();
}


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    loginForm.addEventListener(
        'submit',
        handleLogin
    );


    togglePassword.addEventListener(
        'click',
        handlePasswordToggle
    );


    registerButton.addEventListener(
        'click',
        handleRegister
    );


    emailInput.addEventListener(
        'input',
        () => {
            clearFieldError(
                emailInput,
                emailError
            );

            clearLoginMessage();
        }
    );


    passwordInput.addEventListener(
        'input',
        () => {
            clearFieldError(
                passwordInput,
                passwordError
            );

            clearLoginMessage();
        }
    );
}


/* ============================================================
   LOGIN
============================================================ */

async function handleLogin(event) {

    event.preventDefault();


    clearErrors();

    clearLoginMessage();


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    /*
     * Frontend validation.
     */

    let valid = true;


    if (!email) {

        showFieldError(
            emailInput,
            emailError,
            'Enter your email address.'
        );

        valid = false;

    } else if (!isValidEmail(email)) {

        showFieldError(
            emailInput,
            emailError,
            'Enter a valid email address.'
        );

        valid = false;
    }


    if (!password) {

        showFieldError(
            passwordInput,
            passwordError,
            'Enter your password.'
        );

        valid = false;
    }


    if (!valid) {
        return;
    }


    setLoginLoading(true);


    try {

        const result =
            await api(
                'login',
                {
                    email,
                    password
                }
            );


        /*
         * Extract the returned login data
         * without assuming one exact wrapper.
         */

        const loginData =
            extractLoginData(result);


        if (
            !loginData ||
            !loginData.schoolId
        ) {

            throw new Error(
                'Login succeeded, but the server did not return a School ID.'
            );
        }


        /*
         * Build one consistent frontend session.
         */

        const session =
            buildSession(loginData);


        saveSession(session);


        showLoginMessage(
            'Login successful. Opening your dashboard...',
            'success'
        );


        /*
         * Give the message a moment to appear.
         */

        setTimeout(
            () => {

                window.location.href =
                    DASHBOARD_URL;

            },
            500
        );


    } catch (error) {

        console.error(
            'Login error:',
            error
        );


        showLoginMessage(
            getErrorMessage(error),
            'error'
        );


        setLoginLoading(false);
    }
}


/* ============================================================
   API REQUEST
============================================================ */

async function api(
    action,
    data = {}
) {

    const payload = {

        action,

        ...data
    };


    const response =
        await fetch(
            API_URL,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify(payload)
            }
        );


    if (!response.ok) {

        throw new Error(
            'Unable to connect to the server. HTTP ' +
            response.status
        );
    }


    const result =
        await response.json();


    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.error ||
            result.message ||
            'Login failed.'
        );
    }


    return result;
}


/* ============================================================
   EXTRACT LOGIN DATA
============================================================ */

function extractLoginData(result) {

    if (!result) {
        return null;
    }


    /*
     * Possible response:
     *
     * {
     *   success: true,
     *   user: {...}
     * }
     */

    if (
        result.user &&
        typeof result.user === 'object'
    ) {

        return {
            ...result,
            ...result.user
        };
    }


    /*
     * Possible response:
     *
     * {
     *   success: true,
     *   data: {...}
     * }
     */

    if (
        result.data &&
        typeof result.data === 'object'
    ) {

        if (
            result.data.user &&
            typeof result.data.user === 'object'
        ) {

            return {
                ...result,
                ...result.data,
                ...result.data.user
            };
        }


        return {
            ...result,
            ...result.data
        };
    }


    /*
     * Possible response:
     *
     * {
     *   success: true,
     *   schoolId: "...",
     *   userId: "..."
     * }
     */

    return result;
}


/* ============================================================
   BUILD SESSION
============================================================ */

function buildSession(data) {

    const session = {

        userId:
            firstValue(
                data,
                [
                    'userId',
                    'User ID',
                    'id'
                ]
            ),

        schoolId:
            firstValue(
                data,
                [
                    'schoolId',
                    'School ID'
                ]
            ),

        fullName:
            firstValue(
                data,
                [
                    'fullName',
                    'Full Name',
                    'name'
                ]
            ),

        email:
            firstValue(
                data,
                [
                    'email',
                    'Email'
                ]
            ),

        role:
            firstValue(
                data,
                [
                    'role',
                    'Role'
                ]
            ),

        schoolName:
            firstValue(
                data,
                [
                    'schoolName',
                    'School Name'
                ]
            ),

        status:
            firstValue(
                data,
                [
                    'status',
                    'Status'
                ]
            ),

        loginAt:
            new Date().toISOString()
    };


    return session;
}


/* ============================================================
   SAVE SESSION
============================================================ */

function saveSession(session) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
    );
}


/* ============================================================
   GET SESSION
============================================================ */

function getStoredSession() {

    const raw =
        localStorage.getItem(
            SESSION_KEY
        );


    if (!raw) {
        return null;
    }


    try {

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            'Invalid stored session:',
            error
        );

        localStorage.removeItem(
            SESSION_KEY
        );

        return null;
    }
}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );


    window.location.href =
        'index.html';
}


/*
 * Make logout available to
 * dashboard and other pages.
 */

window.schoolResultsLogout =
    logout;


/* ============================================================
   PASSWORD TOGGLE
============================================================ */

function handlePasswordToggle() {

    const isPassword =
        passwordInput.type === 'password';


    passwordInput.type =
        isPassword
            ? 'text'
            : 'password';


    togglePassword.textContent =
        isPassword
            ? 'Hide'
            : 'Show';
}


/* ============================================================
   REGISTER
============================================================ */

function handleRegister() {

    /*
     * Registration page will be created
     * separately after login is confirmed.
     */

    window.location.href =
        '/app/register.html';
}


/* ============================================================
   LOGIN LOADING
============================================================ */

function setLoginLoading(isLoading) {

    loginButton.disabled =
        isLoading;


    if (isLoading) {

        loginButtonText.textContent =
            'Signing in...';

        loginSpinner.classList.remove(
            'hidden'
        );

    } else {

        loginButtonText.textContent =
            'Sign In';

        loginSpinner.classList.add(
            'hidden'
        );
    }
}


/* ============================================================
   FIELD ERRORS
============================================================ */

function showFieldError(
    input,
    errorElement,
    message
) {

    input.classList.add(
        'input-error'
    );

    errorElement.textContent =
        message;
}


function clearFieldError(
    input,
    errorElement
) {

    input.classList.remove(
        'input-error'
    );

    errorElement.textContent =
        '';
}


function clearErrors() {

    clearFieldError(
        emailInput,
        emailError
    );

    clearFieldError(
        passwordInput,
        passwordError
    );
}


/* ============================================================
   LOGIN MESSAGE
============================================================ */

function showLoginMessage(
    message,
    type
) {

    loginMessage.textContent =
        message;

    loginMessage.className =
        `login-message ${type}`;
}


function clearLoginMessage() {

    loginMessage.textContent = '';

    loginMessage.className =
        'login-message hidden';
}


/* ============================================================
   HELPERS
============================================================ */

function firstValue(
    object,
    keys
) {

    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            String(object[key]).trim() !== ''
        ) {

            return String(
                object[key]
            ).trim();
        }
    }


    return '';
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function getErrorMessage(error) {

    if (
        error &&
        error.message
    ) {

        return error.message;
    }


    return 'Unable to sign in. Please try again.';
}
