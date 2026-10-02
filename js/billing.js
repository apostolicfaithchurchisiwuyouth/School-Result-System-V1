/* =========================================================
   SCHOOL RESULTS SYSTEM
   FILE: billing.js
   VERSION: 1.1.0

   PURPOSE:
   Billing, subscription plans and Paystack payment handling.

   IMPORTANT:
   - Prices are controlled by the backend.
   - This file never contains the Paystack secret key.
   - Payment initialization happens on the backend.
   - Payment verification happens on the backend.
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';

const SESSION_KEY =
    'school_results_system_session_v1';

let currentSession = null;

let currentSubscription = null;

let currentPlans = [];

let paymentInProgress = false;

let paymentPollTimer = null;

let paymentPollAttempts = 0;

const MAX_PAYMENT_POLL_ATTEMPTS = 30;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    initializeBilling
);


async function initializeBilling() {

    setupNavigation();

    setupLogout();

    setupRetry();

    currentSession =
        getSession();

    if (!currentSession) {

        redirectToLogin();

        return;

    }


    const schoolId =
        getSessionSchoolId();

    if (!schoolId) {

        showBillingError(
            'Your school session is incomplete. Please log in again.'
        );

        return;

    }


    populateUserHeader();

    await loadBilling();

}


/* =========================================================
   SESSION
========================================================= */

function getSession() {

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

        if (!session || typeof session !== 'object') {
            return null;
        }

        return session;

    } catch (error) {

        console.error(
            'Session read error:',
            error
        );

        return null;

    }

}


function getSessionSchoolId() {

    if (!currentSession) {
        return '';
    }


    return String(
        currentSession.schoolId ||
        currentSession.schoolID ||
        currentSession.school_id ||
        currentSession.school?.schoolId ||
        currentSession.school?.['School ID'] ||
        ''
    ).trim();

}


/* =========================================================
   LOGIN REDIRECT
========================================================= */

function redirectToLogin() {

    window.location.href =
        'login.html';

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const menuButton =
        document.getElementById(
            'menuButton'
        );

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    const overlay =
        document.getElementById(
            'sidebarOverlay'
        );


    if (!menuButton || !sidebar) {
        return;
    }


    menuButton.addEventListener(
        'click',
        function () {

            sidebar.classList.toggle(
                'open'
            );

            if (overlay) {

                overlay.classList.toggle(
                    'visible'
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            'click',
            function () {

                sidebar.classList.remove(
                    'open'
                );

                overlay.classList.remove(
                    'visible'
                );

            }
        );

    }


    document
        .querySelectorAll(
            '.nav-link'
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    'click',
                    function () {

                        sidebar.classList.remove(
                            'open'
                        );

                        if (overlay) {

                            overlay.classList.remove(
                                'visible'
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            'logoutButton'
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        'click',
        function () {

            const confirmed =
                window.confirm(
                    'Are you sure you want to log out?'
                );


            if (!confirmed) {
                return;
            }


            localStorage.removeItem(
                SESSION_KEY
            );


            window.location.href =
                'login.html';

        }
    );

}


/* =========================================================
   RETRY
========================================================= */

function setupRetry() {

    const retryButton =
        document.getElementById(
            'retryButton'
        );


    if (!retryButton) {
        return;
    }


    retryButton.addEventListener(
        'click',
        async function () {

            hideBillingError();

            await loadBilling();

        }
    );

}


/* =========================================================
   HEADER
========================================================= */

function populateUserHeader() {

    const schoolName =
        document.getElementById(
            'schoolName'
        );

    const userName =
        document.getElementById(
            'userName'
        );

    const userRole =
        document.getElementById(
            'userRole'
        );

    const userInitials =
        document.getElementById(
            'userInitials'
        );


    const school =
        currentSession?.school ||
        {};


    const user =
        currentSession?.user ||
        {};


    const resolvedSchoolName =
        currentSession.schoolName ||
        currentSession.school_name ||
        school.schoolName ||
        school['School Name'] ||
        'School Results System';


    const resolvedUserName =
        currentSession.userName ||
        currentSession.name ||
        user.name ||
        user.fullName ||
        user['Name'] ||
        'User';


    const resolvedRole =
        currentSession.role ||
        user.role ||
        user['Role'] ||
        '--';


    if (schoolName) {

        schoolName.textContent =
            resolvedSchoolName;

    }


    if (userName) {

        userName.textContent =
            resolvedUserName;

    }


    if (userRole) {

        userRole.textContent =
            resolvedRole;

    }


    if (userInitials) {

        userInitials.textContent =
            getInitials(
                resolvedUserName
            );

    }

}


function getInitials(name) {

    const value =
        String(name || '')
            .trim();


    if (!value) {
        return '--';
    }


    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    action,
    data = {}
) {

    const payload = {
        action,
        ...data
    };


    let response;


    try {

        response =
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

    } catch (error) {

        console.error(
            'Network/API request error:',
            error
        );

        throw new Error(
            'Unable to connect to the school results server.'
        );

    }


    let result;


    try {

        result =
            await response.json();

    } catch (error) {

        console.error(
            'Invalid JSON response:',
            error
        );

        throw new Error(
            'The server returned an invalid response.'
        );

    }


    if (!response.ok) {

        throw new Error(
            result?.message ||
            result?.error ||
            `Server request failed (${response.status}).`
        );

    }


    if (!result || result.success !== true) {

        throw new Error(
            result?.message ||
            result?.error ||
            'The request could not be completed.'
        );

    }


    return result;

}


/* =========================================================
   LOAD BILLING
========================================================= */

async function loadBilling() {

    showLoading();

    hideBillingError();


    const schoolId =
        getSessionSchoolId();


    if (!schoolId) {

        showBillingError(
            'School ID could not be found in your session.'
        );

        return;

    }


    try {

        /*
         * Load the subscription first.
         */

        const subscriptionResult =
            await apiRequest(
                'getSchoolSubscription',
                {
                    schoolId:
                        schoolId
                }
            );


        /*
         * Then load plans.
         */

        const plansResult =
            await apiRequest(
                'getSubscriptionPlans'
            );


        currentSubscription =
            subscriptionResult.subscription ||
            null;


        currentPlans =
            Array.isArray(
                plansResult.plans
            )
                ? plansResult.plans
                : [];


        if (!currentSubscription) {

            throw new Error(
                'The server did not return your subscription information.'
            );

        }


        renderSubscription(
            currentSubscription
        );


        renderPlans(
            currentPlans,
            currentSubscription
        );


        hideLoading();

        showBillingContent();


    } catch (error) {

        console.error(
            'Billing error:',
            error
        );


        hideLoading();

        showBillingError(
            error.message ||
            'Unable to load billing information.'
        );

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            'pageLoading'
        );


    const content =
        document.getElementById(
            'billingContent'
        );


    if (loading) {

        loading.classList.remove(
            'hidden'
        );

    }


    if (content) {

        content.classList.add(
            'hidden'
        );

    }

}


function hideLoading() {

    const loading =
        document.getElementById(
            'pageLoading'
        );


    if (loading) {

        loading.classList.add(
            'hidden'
        );

    }

}


function showBillingContent() {

    const content =
        document.getElementById(
            'billingContent'
        );


    if (content) {

        content.classList.remove(
            'hidden'
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showBillingError(
    message
) {

    const errorBox =
        document.getElementById(
            'billingError'
        );

    const errorMessage =
        document.getElementById(
            'billingErrorMessage'
        );


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            'Unable to load billing information.';

    }


    if (errorBox) {

        errorBox.classList.remove(
            'hidden'
        );

    }


    const content =
        document.getElementById(
            'billingContent'
        );


    if (content) {

        content.classList.add(
            'hidden'
        );

    }

}


function hideBillingError() {

    const errorBox =
        document.getElementById(
            'billingError'
        );


    if (errorBox) {

        errorBox.classList.add(
            'hidden'
        );

    }

}


/* =========================================================
   RENDER CURRENT SUBSCRIPTION
========================================================= */

function renderSubscription(
    subscription
) {

    const schoolName =
        document.getElementById(
            'schoolName'
        );

    const currentSchoolName =
        document.getElementById(
            'currentSchoolName'
        );

    const currentPlanName =
        document.getElementById(
            'currentPlanName'
        );

    const currentPlanStatus =
        document.getElementById(
            'currentPlanStatus'
        );

    const currentExpiryDate =
        document.getElementById(
            'currentExpiryDate'
        );


    const resolvedSchoolName =
        subscription.schoolName ||
        'School';


    const plan =
        subscription.plan ||
        'Free';


    const status =
        String(
            subscription.subscriptionStatus ||
            subscription.status ||
            'unknown'
        ).toLowerCase();


    if (schoolName) {

        schoolName.textContent =
            resolvedSchoolName;

    }


    if (currentSchoolName) {

        currentSchoolName.textContent =
            resolvedSchoolName;

    }


    if (currentPlanName) {

        currentPlanName.textContent =
            plan;

    }


    if (currentPlanStatus) {

        currentPlanStatus.textContent =
            formatStatus(status);


        currentPlanStatus.className =
            'status-badge ' +
            getStatusClass(status);

    }


    if (currentExpiryDate) {

        currentExpiryDate.textContent =
            formatDate(
                subscription.expiryDate
            );

    }


    renderSubscriptionNotices(
        subscription,
        status
    );

}


function renderSubscriptionNotices(
    subscription,
    status
) {

    const trialNotice =
        document.getElementById(
            'trialNotice'
        );

    const trialNoticeText =
        document.getElementById(
            'trialNoticeText'
        );

    const expiredNotice =
        document.getElementById(
            'expiredNotice'
        );


    if (trialNotice) {

        trialNotice.classList.add(
            'hidden'
        );

    }


    if (expiredNotice) {

        expiredNotice.classList.add(
            'hidden'
        );

    }


    if (
        subscription.plan === 'Free' &&
        status === 'active'
    ) {

        if (trialNotice) {

            trialNotice.classList.remove(
                'hidden'
            );

        }


        if (trialNoticeText) {

            trialNoticeText.textContent =
                'Your 40-minute free trial is currently active. Choose a paid plan below when you are ready to continue beyond the trial.';

        }

    }


    if (
        status === 'expired'
    ) {

        if (expiredNotice) {

            expiredNotice.classList.remove(
                'hidden'
            );

        }

    }


    if (
        status === 'suspended'
    ) {

        if (expiredNotice) {

            expiredNotice.classList.remove(
                'hidden'
            );

        }

        const message =
            expiredNotice.querySelector(
                'span'
            );


        if (message) {

            message.textContent =
                'This school account is currently suspended. Please contact the administrator before making a subscription payment.';

        }

    }

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function formatStatus(
    status
) {

    switch (
        String(status || '').toLowerCase()
    ) {

        case 'active':
            return 'Active';

        case 'expired':
            return 'Expired';

        case 'suspended':
            return 'Suspended';

        default:
            return 'Unknown';

    }

}


function getStatusClass(
    status
) {

    switch (
        String(status || '').toLowerCase()
    ) {

        case 'active':
            return 'active';

        case 'expired':
            return 'expired';

        case 'suspended':
            return 'suspended';

        default:
            return '';

    }

}


/* =========================================================
   RENDER PLANS
========================================================= */

function renderPlans(
    plans,
    subscription
) {

    const grid =
        document.getElementById(
            'plansGrid'
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = '';


    if (!Array.isArray(plans) ||
        plans.length === 0) {

        grid.innerHTML = `
            <div class="empty-plan-message">
                No subscription plans are currently available.
            </div>
        `;

        return;

    }


    plans.forEach(
        function (plan) {

            grid.appendChild(
                createPlanCard(
                    plan,
                    subscription
                )
            );

        }
    );

}


/* =========================================================
   PLAN CARD
========================================================= */

function createPlanCard(
    plan,
    subscription
) {

    const card =
        document.createElement(
            'article'
        );


    const planName =
        String(
            plan.name || ''
        );


    const currentPlan =
        String(
            subscription?.plan || ''
        );


    const isCurrent =
        planName.toLowerCase() ===
        currentPlan.toLowerCase();


    const isFree =
        planName.toLowerCase() ===
        'free';


    card.className =
        'plan-card' +
        (
            isCurrent
                ? ' current'
                : ''
        ) +
        (
            planName.toLowerCase() ===
            'standard'
                ? ' featured'
                : ''
        );


    const price =
        Number(
            plan.amountNaira || 0
        );


    const duration =
        getPlanDurationText(
            plan
        );


    const description =
        getPlanDescription(
            planName
        );


    const features =
        getPlanFeatures(
            planName
        );


    let badge = '';


    if (
        planName.toLowerCase() ===
        'standard'
    ) {

        badge =
            '<span class="plan-badge">POPULAR</span>';

    }


    if (isCurrent) {

        badge =
            '<span class="plan-badge">CURRENT</span>';

    }


    const featuresHtml =
        features
            .map(
                function (feature) {

                    return `
                        <div class="plan-feature">
                            <span class="plan-feature-icon">✓</span>
                            <span>${escapeHtml(feature)}</span>
                        </div>
                    `;

                }
            )
            .join('');


    let buttonText;

    let buttonClass =
        'plan-action';


    if (isCurrent) {

        buttonText =
            'Current Plan';

        buttonClass +=
            ' secondary';

    } else if (isFree) {

        buttonText =
            'Included Trial';

        buttonClass +=
            ' secondary';

    } else {

        buttonText =
            `Choose ${escapeHtml(planName)}`;

    }


    card.innerHTML = `
        ${badge}

        <div class="plan-name">
            ${escapeHtml(planName)}
        </div>

        <div class="plan-description">
            ${escapeHtml(description)}
        </div>

        <div class="plan-price">
            <strong>
                ${formatNaira(price)}
            </strong>
            ${
                price > 0
                    ? '<span>NGN</span>'
                    : '<span>trial</span>'
            }
        </div>

        <div class="plan-duration">
            ${escapeHtml(duration)}
        </div>

        <div class="plan-divider"></div>

        <div class="plan-includes">

            <div class="plan-includes-title">
                Includes
            </div>

            ${featuresHtml}

        </div>

        <button
            type="button"
            class="${buttonClass}"
            data-plan="${escapeAttribute(planName)}"
            ${isCurrent || isFree ? 'disabled' : ''}
        >
            ${buttonText}
        </button>
    `;


    const button =
        card.querySelector(
            '.plan-action'
        );


    if (
        button &&
        !isCurrent &&
        !isFree
    ) {

        button.addEventListener(
            'click',
            function () {

                startPayment(
                    plan
                );

            }
        );

    }


    return card;

}


/* =========================================================
   PLAN DESCRIPTIONS
========================================================= */

function getPlanDescription(
    planName
) {

    switch (
        String(planName || '').toLowerCase()
    ) {

        case 'free':

            return (
                'A 40-minute trial for exploring the school result management system.'
            );


        case 'basic':

            return (
                'Core school result management access for one academic term.'
            );


        case 'standard':

            return (
                'Core school result management access for one full year.'
            );


        case 'premium':

            return (
                'Core school result management access for one full year.'
            );


        default:

            return (
                'School result management access based on the selected subscription period.'
            );

    }

}


/* =========================================================
   PLAN FEATURES
========================================================= */

function getPlanFeatures(
    planName
) {

    const commonPaidFeatures = [

        'Academic sessions and classes',

        'Subjects and teacher management',

        'Student records and assignments',

        'Grading and score entry',

        'Result processing and reports'

    ];


    switch (
        String(planName || '').toLowerCase()
    ) {

        case 'free':

            return [

                '40-minute trial access',

                'Explore the school management interface',

                'Set up and test the system',

                'Choose a paid plan when ready'

            ];


        case 'basic':

            return [
                ...commonPaidFeatures,

                'Access for one academic term'

            ];


        case 'standard':

            return [
                ...commonPaidFeatures,

                'Access for one full year'

            ];


        case 'premium':

            return [
                ...commonPaidFeatures,

                'Access for one full year'

            ];


        default:

            return commonPaidFeatures;

    }

}


/* =========================================================
   PLAN DURATION
========================================================= */

function getPlanDurationText(
    plan
) {

    const type =
        String(
            plan.durationType || ''
        ).toLowerCase();


    if (type === 'trial') {

        return '40-minute free trial';

    }


    if (type === 'term') {

        return '1 academic term';

    }


    if (type === 'year') {

        return '1 year';

    }


    if (plan.durationDays) {

        return (
            `${plan.durationDays} days`
        );

    }


    return 'Subscription period';

}


/* =========================================================
   START PAYMENT
========================================================= */

async function startPayment(
    plan
) {

    if (paymentInProgress) {
        return;
    }


    const schoolId =
        getSessionSchoolId();


    if (!schoolId) {

        showPaymentMessage(
            'error',
            'Payment unavailable',
            'Your school session could not be found. Please log in again.'
        );

        return;

    }


    const planName =
        String(
            plan?.name || ''
        ).trim();


    if (!planName ||
        planName.toLowerCase() === 'free') {

        return;

    }


    const amount =
        Number(
            plan.amountNaira || 0
        );


    if (!amount || amount <= 0) {

        showPaymentMessage(
            'error',
            'Invalid plan',
            'The selected plan does not have a valid payment amount.'
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Continue to payment for the ${planName} plan at ${formatNaira(amount)}?`
        );


    if (!confirmed) {
        return;
    }


    paymentInProgress =
        true;


    setPlanButtonsDisabled(
        true
    );


    showPaymentMessage(
        'loading',
        'Preparing payment',
        'Please wait while we securely prepare your Paystack checkout.'
    );


    try {

        const result =
            await apiRequest(
                'initializePaystackPayment',
                {
                    schoolId:
                        schoolId,

                    plan:
                        planName
                }
            );


        const payment =
            result.payment ||
            {};


        const accessCode =
            payment.accessCode ||
            payment.access_code;


        const reference =
            payment.reference;


        if (!accessCode) {

            throw new Error(
                'Paystack did not return a payment access code.'
            );

        }


        if (!reference) {

            throw new Error(
                'Paystack did not return a payment reference.'
            );

        }


        if (
            !window.PaystackPop
        ) {

            throw new Error(
                'Paystack checkout could not be loaded. Please refresh the page and try again.'
            );

        }


        showPaymentMessage(
            'loading',
            'Checkout ready',
            'Complete your payment in the Paystack window.'
        );


        const popup =
            new PaystackPop();


        /*
         * Paystack Popup V2 supports resuming
         * a transaction using the backend-generated
         * access code.
         *
         * We do not put the secret key in the browser.
         */

        popup.resumeTransaction(
            accessCode
        );


        /*
         * Because the V2 resume flow does not require
         * the secret key on the frontend, we verify the
         * reference through our backend after checkout.
         *
         * Polling begins shortly after the popup opens.
         */

        beginPaymentVerificationPolling(
            reference
        );


    } catch (error) {

        console.error(
            'Payment initialization error:',
            error
        );


        paymentInProgress =
            false;


        setPlanButtonsDisabled(
            false
        );


        showPaymentMessage(
            'error',
            'Payment could not be started',
            error.message ||
            'Unable to start the payment.'
        );

    }

}


/* =========================================================
   PAYMENT VERIFICATION POLLING
========================================================= */

function beginPaymentVerificationPolling(
    reference
) {

    stopPaymentVerificationPolling();


    paymentPollAttempts =
        0;


    paymentPollTimer =
        window.setInterval(
            async function () {

                paymentPollAttempts++;


                if (
                    paymentPollAttempts >
                    MAX_PAYMENT_POLL_ATTEMPTS
                ) {

                    stopPaymentVerificationPolling();


                    paymentInProgress =
                        false;


                    setPlanButtonsDisabled(
                        false
                    );


                    showPaymentMessage(
                        'info',
                        'Payment still processing',
                        'We could not confirm the payment yet. If Paystack shows the payment as successful, click Retry Billing below or refresh the page shortly.'
                    );


                    return;

                }


                try {

                    const result =
                        await apiRequest(
                            'verifyPaystackPayment',
                            {
                                reference:
                                    reference
                            }
                        );


                    if (
                        result.paid === true
                    ) {

                        await handlePaymentSuccess(
                            result
                        );

                        return;

                    }


                    /*
                     * A successful API response with
                     * paid=false means Paystack has not
                     * confirmed the transaction yet.
                     *
                     * Keep polling.
                     */

                } catch (error) {

                    /*
                     * Do not immediately fail the entire
                     * payment flow on a temporary verification
                     * request error.
                     */

                    console.warn(
                        'Payment verification attempt:',
                        error.message
                    );

                }

            },
            4000
        );

}


function stopPaymentVerificationPolling() {

    if (paymentPollTimer) {

        window.clearInterval(
            paymentPollTimer
        );

        paymentPollTimer =
            null;

    }

}


/* =========================================================
   PAYMENT SUCCESS
========================================================= */

async function handlePaymentSuccess(
    result
) {

    stopPaymentVerificationPolling();


    paymentInProgress =
        false;


    setPlanButtonsDisabled(
        false
    );


    const subscription =
        result.subscription ||
        {};


    showPaymentMessage(
        'success',
        'Payment successful',
        `Your ${subscription.plan || 'subscription'} plan is now active.`
    );


    /*
     * Reload the subscription from the server.
     * This prevents the browser from becoming the
     * authority for the current plan.
     */

    await refreshBillingAfterPayment();

}


/* =========================================================
   REFRESH AFTER PAYMENT
========================================================= */

async function refreshBillingAfterPayment() {

    const schoolId =
        getSessionSchoolId();


    if (!schoolId) {
        return;
    }


    try {

        const subscriptionResult =
            await apiRequest(
                'getSchoolSubscription',
                {
                    schoolId:
                        schoolId
                }
            );


        const plansResult =
            await apiRequest(
                'getSubscriptionPlans'
            );


        currentSubscription =
            subscriptionResult.subscription ||
            null;


        currentPlans =
            Array.isArray(
                plansResult.plans
            )
                ? plansResult.plans
                : [];


        renderSubscription(
            currentSubscription
        );


        renderPlans(
            currentPlans,
            currentSubscription
        );


    } catch (error) {

        console.error(
            'Unable to refresh billing:',
            error
        );

    }

}


/* =========================================================
   PAYMENT MESSAGE
========================================================= */

function showPaymentMessage(
    type,
    title,
    message
) {

    const box =
        document.getElementById(
            'paymentMessage'
        );

    const icon =
        document.getElementById(
            'paymentMessageIcon'
        );

    const titleElement =
        document.getElementById(
            'paymentMessageTitle'
        );

    const textElement =
        document.getElementById(
            'paymentMessageText'
        );


    if (!box) {
        return;
    }


    box.classList.remove(
        'hidden'
    );


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (textElement) {

        textElement.textContent =
            message;

    }


    if (icon) {

        if (type === 'error') {

            icon.textContent =
                '!';

            box.style.borderColor =
                '#fecaca';

            box.style.background =
                '#fef2f2';

            box.style.color =
                '#dc2626';

        } else if (type === 'loading') {

            icon.textContent =
                '…';

            box.style.borderColor =
                '#dfe2ff';

            box.style.background =
                '#eef2ff';

            box.style.color =
                '#4f46e5';

        } else if (type === 'info') {

            icon.textContent =
                'i';

            box.style.borderColor =
                '#dfe2ff';

            box.style.background =
                '#eef2ff';

            box.style.color =
                '#4f46e5';

        } else {

            icon.textContent =
                '✓';

            box.style.borderColor =
                '#bbf7d0';

            box.style.background =
                '#ecfdf3';

            box.style.color =
                '#15803d';

        }

    }

}


/* =========================================================
   PLAN BUTTON STATE
========================================================= */

function setPlanButtonsDisabled(
    disabled
) {

    document
        .querySelectorAll(
            '.plan-action'
        )
        .forEach(
            function (button) {

                if (
                    button.textContent
                        .trim()
                        .toLowerCase()
                        .includes('current')
                ) {
                    return;
                }


                if (
                    button.textContent
                        .trim()
                        .toLowerCase()
                        .includes('included trial')
                ) {
                    return;
                }


                button.disabled =
                    disabled;

            }
        );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return '—';
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return '—';

    }


    return date.toLocaleDateString(
        'en-NG',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }
    );

}


/* =========================================================
   CURRENCY
========================================================= */

function formatNaira(
    amount
) {

    const numeric =
        Number(amount || 0);


    return '₦' +
        numeric.toLocaleString(
            'en-NG'
        );

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   PAGE EXIT CLEANUP
========================================================= */

window.addEventListener(
    'beforeunload',
    function () {

        stopPaymentVerificationPolling();

    }
);
