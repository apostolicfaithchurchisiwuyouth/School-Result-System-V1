/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: register.js
   VERSION: 1.0.0

   PURPOSE:
   School registration frontend.
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';


/* ============================================================
   DOM
============================================================ */

const registerForm =
    document.getElementById('registerForm');

const schoolNameInput =
    document.getElementById('schoolName');

const schoolCodeInput =
    document.getElementById('schoolCode');

const addressInput =
    document.getElementById('address');

const schoolPhoneInput =
    document.getElementById('schoolPhone');

const schoolEmailInput =
    document.getElementById('schoolEmail');

const adminNameInput =
    document.getElementById('adminName');

const adminPhoneInput =
    document.getElementById('adminPhone');

const adminEmailInput =
    document.getElementById('adminEmail');

const passwordInput =
    document.getElementById('password');

const confirmPasswordInput =
    document.getElementById('confirmPassword');

const togglePassword =
    document.getElementById('togglePassword');

const toggleConfirmPassword =
    document.getElementById(
        'toggleConfirmPassword'
    );

const registerButton =
    document.getElementById(
        'registerButton'
    );

const registerButtonText =
    document.getElementById(
        'registerButtonText'
    );

const registerSpinner =
    document.getElementById(
        'registerSpinner'
    );

const registerMessage =
    document.getElementById(
        'registerMessage'
    );


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initializeRegistration
);


function initializeRegistration() {

    bindEvents();

    /*
     * Automatically format the school code
     * as the user types.
     */
    schoolCodeInput.addEventListener(
        'input',
        () => {

            schoolCodeInput.value =
                schoolCodeInput.value
                    .toUpperCase()
                    .replace(/\s/g, '');
        }
    );
}


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    registerForm.addEventListener(
        'submit',
        handleRegistration
    );


    togglePassword.addEventListener(
        'click',
        () => {

            togglePasswordVisibility(
                passwordInput,
                togglePassword
            );
        }
    );


    toggleConfirmPassword.addEventListener(
        'click',
        () => {

            togglePasswordVisibility(
                confirmPasswordInput,
                toggleConfirmPassword
            );
        }
    );


    const inputs =
        registerForm.querySelectorAll(
            'input'
        );


    inputs.forEach(
        input => {

            input.addEventListener(
                'input',
                () => {

                    clearInputError(
                        input
                    );

                    clearRegisterMessage();
                }
            );
        }
    );
}


/* ============================================================
   REGISTRATION
============================================================ */

async function handleRegistration(event) {

    event.preventDefault();


    clearAllErrors();

    clearRegisterMessage();


    const formData = {

        schoolName:
            schoolNameInput.value.trim(),

        schoolCode:
            schoolCodeInput.value
                .trim()
                .toUpperCase(),

        address:
            addressInput.value.trim(),

        phone:
            schoolPhoneInput.value.trim(),

        email:
            schoolEmailInput.value.trim(),

        adminName:
            adminNameInput.value.trim(),

        adminPhone:
            adminPhoneInput.value.trim(),

        adminEmail:
            adminEmailInput.value.trim(),

        password:
            passwordInput.value
    };


    const confirmPassword =
        confirmPasswordInput.value;


    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

    const valid =
        validateRegistration(
            formData,
            confirmPassword
        );


    if (!valid) {
        return;
    }


    setRegistrationLoading(true);


    try {

        const result =
            await api(
                'registerSchool',
                formData
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.error ||
                result?.message ||
                'Registration failed.'
            );
        }


        /*
         * Registration succeeded.
         *
         * We intentionally do NOT automatically
         * log the administrator in here.
         *
         * The administrator will go to index.html
         * and sign in normally.
         */

        const school =
            result.school || {};

        const user =
            result.user || {};


        showRegisterMessage(
            `School registration completed successfully. ` +
            `${school.schoolName || 'Your school'} ` +
            `has been created. You can now sign in.`,
            'success'
        );


        /*
         * Disable the form after successful
         * registration so the same school isn't
         * accidentally submitted again.
         */

        setRegistrationLoading(
            true
        );


        setTimeout(
            () => {

                window.location.href =
                    'index.html';

            },
            1800
        );


    } catch (error) {

        console.error(
            'Registration error:',
            error
        );


        showRegisterMessage(
            getErrorMessage(error),
            'error'
        );


        setRegistrationLoading(
            false
        );
    }
}


/* ============================================================
   VALIDATION
============================================================ */

function validateRegistration(
    data,
    confirmPassword
) {

    let valid = true;


    if (!data.schoolName) {

        showInputError(
            schoolNameInput,
            'School name is required.'
        );

        valid = false;
    }


    if (!data.schoolCode) {

        showInputError(
            schoolCodeInput,
            'School code is required.'
        );

        valid = false;
    }


    if (!data.adminName) {

        showInputError(
            adminNameInput,
            'Administrator name is required.'
        );

        valid = false;
    }


    if (!data.adminEmail) {

        showInputError(
            adminEmailInput,
            'Administrator email is required.'
        );

        valid = false;

    } else if (
        !isValidEmail(data.adminEmail)
    ) {

        showInputError(
            adminEmailInput,
            'Enter a valid administrator email.'
        );

        valid = false;
    }


    if (
        data.schoolEmail &&
        !isValidEmail(data.schoolEmail)
    ) {

        showInputError(
            schoolEmailInput,
            'Enter a valid school email.'
        );

        valid = false;
    }


    if (!data.password) {

        showInputError(
            passwordInput,
            'Password is required.'
        );

        valid = false;

    } else if (
        data.password.length < 6
    ) {

        showInputError(
            passwordInput,
            'Password must contain at least 6 characters.'
        );

        valid = false;
    }


    if (!confirmPassword) {

        showInputError(
            confirmPasswordInput,
            'Please confirm your password.'
        );

        valid = false;

    } else if (
        data.password !== confirmPassword
    ) {

        showInputError(
            confirmPasswordInput,
            'Passwords do not match.'
        );

        valid = false;
    }


    return valid;
}


/* ============================================================
   API
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


    return result;
}


/* ============================================================
   PASSWORD VISIBILITY
============================================================ */

function togglePasswordVisibility(
    input,
    button
) {

    const showing =
        input.type === 'text';


    if (showing) {

        input.type =
            'password';

        button.textContent =
            'Show';

    } else {

        input.type =
            'text';

        button.textContent =
            'Hide';
    }
}


/* ============================================================
   LOADING
============================================================ */

function setRegistrationLoading(
    loading
) {

    registerButton.disabled =
        loading;


    if (loading) {

        registerButtonText.textContent =
            'Creating account...';

        registerSpinner.classList.remove(
            'hidden'
        );

    } else {

        registerButtonText.textContent =
            'Create School Account';

        registerSpinner.classList.add(
            'hidden'
        );
    }
}


/* ============================================================
   INPUT ERRORS
============================================================ */

function showInputError(
    input,
    message
) {

    input.classList.add(
        'input-error'
    );


    const errorElement =
        document.getElementById(
            input.id + 'Error'
        );


    if (errorElement) {

        errorElement.textContent =
            message;
    }
}


function clearInputError(
    input
) {

    input.classList.remove(
        'input-error'
    );


    const errorElement =
        document.getElementById(
            input.id + 'Error'
        );


    if (errorElement) {

        errorElement.textContent =
            '';
    }
}


function clearAllErrors() {

    const inputs =
        registerForm.querySelectorAll(
            'input'
        );


    inputs.forEach(
        input => {

            clearInputError(
                input
            );
        }
    );
}


/* ============================================================
   MESSAGE
============================================================ */

function showRegisterMessage(
    message,
    type
) {

    registerMessage.textContent =
        message;

    registerMessage.className =
        `register-message ${type}`;
}


function clearRegisterMessage() {

    registerMessage.textContent =
        '';

    registerMessage.className =
        'register-message hidden';
}


/* ============================================================
   HELPERS
============================================================ */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function getErrorMessage(
    error
) {

    if (
        error &&
        error.message
    ) {

        return error.message;
    }


    return (
        'Unable to complete registration. ' +
        'Please try again.'
    );
}
