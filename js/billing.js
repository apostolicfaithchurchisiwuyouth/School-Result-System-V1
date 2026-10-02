/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: billing.js
 * VERSION: 1.1.0
 *
 * PURPOSE:
 * Subscription and Paystack payment frontend.
 * ============================================================
 */


/* ============================================================
   CONFIGURATION
============================================================ */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';

const SESSION_KEY =
    'school_results_system_session_v1';


/* ============================================================
   DOM
============================================================ */

const pageLoading =
    document.getElementById(
        'pageLoading'
    );

const billingContent =
    document.getElementById(
        'billingContent'
    );

const billingError =
    document.getElementById(
        'billingError'
    );

const billingErrorMessage =
    document.getElementById(
        'billingErrorMessage'
    );

const plansGrid =
    document.getElementById(
        'plansGrid'
    );

const retryButton =
    document.getElementById(
        'retryButton'
    );

const menuButton =
    document.getElementById(
        'menuButton'
    );

const sidebar =
    document.getElementById(
        'sidebar'
    );

const sidebarOverlay =
    document.getElementById(
        'sidebarOverlay'
    );

const sidebarLogoutButton =
    document.getElementById(
        'sidebarLogoutButton'
    );


/* ============================================================
   START
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initializeBilling
);


/* ============================================================
   INITIALIZE
============================================================ */

function initializeBilling() {

    setupNavigation();

    setupLogout();

    setupRetry();


    const session =
        getStoredSession();


    if (
        !session ||
        !session.schoolId
    ) {

        redirectToLogin();

        return;

    }


    populateUserHeader(
        session
    );


    loadBilling();

}


/* ============================================================
   SESSION
============================================================ */

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
            JSON.parse(
                raw
            );


        if (
            !session ||
            typeof session !== 'object'
        ) {

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


/* ============================================================
   REDIRECT
============================================================ */

function redirectToLogin() {

    window.location.href =
        'index.html';

}


/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
    action,
    data = {}
) {

    const payload = {

        action:
            action,

        ...data

    };


    const response =
        await fetch(
            API_URL,
            {

                method:
                    'POST',

                headers: {

                    'Content-Type':
                        'text/plain;charset=utf-8'

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (!response.ok) {

        throw new Error(
            'Server request failed with status ' +
            response.status +
            '.'
        );

    }


    const result =
        await response.json();


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


/* ============================================================
   LOAD BILLING
============================================================ */

async function loadBilling() {

    showLoading();


    try {

        const session =
            getStoredSession();


        if (
            !session ||
            !session.schoolId
        ) {

            redirectToLogin();

            return;

        }


        const subscriptionResult =
            await apiRequest(
                'getSchoolSubscription',
                {

                    schoolId:
                        session.schoolId

                }
            );


        const plansResult =
            await apiRequest(
                'getSubscriptionPlans'
            );


        const subscription =
            extractSubscription(
                subscriptionResult
            );


        const plans =
            extractPlans(
                plansResult
            );


        if (!subscription) {

            throw new Error(
                'The server did not return subscription information.'
            );

        }


        renderSubscription(
            subscription
        );


        renderPlans(
            plans,
            subscription
        );


        showBilling();

    } catch (error) {

        console.error(
            'Billing error:',
            error
        );


        showBillingError(
            error.message ||
            'Unable to load subscription information.'
        );

    }

}


/* ============================================================
   EXTRACT SUBSCRIPTION
============================================================ */

function extractSubscription(
    result
) {

    if (
        result &&
        result.subscription
    ) {

        return result.subscription;

    }


    if (
        result &&
        result.data &&
        result.data.subscription
    ) {

        return result.data.subscription;

    }


    return null;

}


/* ============================================================
   EXTRACT PLANS
============================================================ */

function extractPlans(
    result
) {

    if (
        result &&
        Array.isArray(
            result.plans
        )
    ) {

        return result.plans;

    }


    if (
        result &&
        result.data &&
        Array.isArray(
            result.data.plans
        )
    ) {

        return result.data.plans;

    }


    return [];

}


/* ============================================================
   USER HEADER
============================================================ */

function populateUserHeader(
    session
) {

    const fullName =
        session.fullName ||
        session.name ||
        'User';

    const role =
        session.role ||
        'User';


    setText(
        'topbarUserName',
        fullName
    );


    setText(
        'topbarUserRole',
        role
    );


    setText(
        'userInitials',
        getInitials(
            fullName
        )
    );

}


/* ============================================================
   RENDER SUBSCRIPTION
============================================================ */

function renderSubscription(
    subscription
) {

    setText(
        'topbarSchoolName',
        subscription.schoolName ||
        'School Results System'
    );


    setText(
        'currentSchoolName',
        subscription.schoolName ||
        '—'
    );


    setText(
        'currentPlanName',
        formatPlan(
            subscription.plan
        )
    );


    const status =
        String(
            subscription.subscriptionStatus ||
            subscription.status ||
            ''
        )
        .trim()
        .toLowerCase();


    const statusElement =
        document.getElementById(
            'currentPlanStatus'
        );


    if (statusElement) {

        statusElement.classList.remove(
            'expired',
            'suspended'
        );


        if (
            status === 'expired'
        ) {

            statusElement.textContent =
                'Expired';

            statusElement.classList.add(
                'expired'
            );

        } else if (
            status === 'suspended'
        ) {

            statusElement.textContent =
                'Suspended';

            statusElement.classList.add(
                'suspended'
            );

        } else {

            statusElement.textContent =
                'Active';

        }

    }


    const expiry =
        subscription.expiryDate;


    setText(
        'currentExpiryDate',
        expiry
            ? formatDate(
                expiry
              )
            : 'No expiry date'
    );


    renderTrialNotice(
        subscription
    );


    renderExpiredNotice(
        status
    );

}


/* ============================================================
   TRIAL NOTICE
============================================================ */

function renderTrialNotice(
    subscription
) {

    const trialNotice =
        document.getElementById(
            'trialNotice'
        );


    const trialNoticeText =
        document.getElementById(
            'trialNoticeText'
        );


    if (!trialNotice) {
        return;
    }


    const isFree =
        String(
            subscription.plan ||
            ''
        )
        .toLowerCase() ===
        'free';


    if (!isFree) {

        trialNotice.classList.add(
            'hidden'
        );

        return;

    }


    trialNotice.classList.remove(
        'hidden'
    );


    const expiry =
        subscription.expiryDate;


    if (!expiry) {

        if (trialNoticeText) {

            trialNoticeText.textContent =
                'Your free trial is active.';

        }

        return;

    }


    const expiryDate =
        new Date(
            expiry
        );


    if (
        isNaN(
            expiryDate.getTime()
        )
    ) {

        if (trialNoticeText) {

            trialNoticeText.textContent =
                'Your free trial is active.';

        }

        return;

    }


    const remaining =
        expiryDate.getTime() -
        Date.now();


    if (
        remaining <= 0
    ) {

        if (trialNoticeText) {

            trialNoticeText.textContent =
                'Your free trial has expired. Choose a paid plan below to continue.';

        }

        return;

    }


    const minutes =
        Math.ceil(
            remaining /
            60000
        );


    if (trialNoticeText) {

        trialNoticeText.textContent =
            `Your free trial is active. Approximately ${minutes} minute${minutes === 1 ? '' : 's'} remaining.`;

    }

}


/* ============================================================
   EXPIRED NOTICE
============================================================ */

function renderExpiredNotice(
    status
) {

    const expiredNotice =
        document.getElementById(
            'expiredNotice'
        );


    if (!expiredNotice) {
        return;
    }


    if (
        status === 'expired'
    ) {

        expiredNotice.classList.remove(
            'hidden'
        );

    } else {

        expiredNotice.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   PLAN BENEFITS
============================================================ */

function getPlanBenefits(
    planName
) {

    const name =
        String(
            planName ||
            ''
        )
        .toLowerCase();


    if (
        name === 'free'
    ) {

        return [

            'Explore the result management system',

            'Create your initial school setup',

            'Access available system features during the trial'

        ];

    }


    if (
        name === 'basic'
    ) {

        return [

            'Full result management access',

            'One academic term of access',

            'Manage classes, subjects and teachers',

            'Enter and manage student scores',

            'Generate student and class results'

        ];

    }


    if (
        name === 'standard'
    ) {

        return [

            'Everything in Basic',

            'One full year of access',

            'Manage multiple academic sessions',

            'Complete result processing workflow',

            'Result history and previous-term records',

            'PDF result generation'

        ];

    }


    if (
        name === 'premium'
    ) {

        return [

            'Everything in Standard',

            'One full year of access',

            'Full school result management tools',

            'Bulk result and score processing',

            'Advanced result management features',

            'Priority-ready subscription tier'

        ];

    }


    return [

        'School Results System access'

    ];

}


/* ============================================================
   RENDER PLANS
============================================================ */

function renderPlans(
    plans,
    subscription
) {

    if (!plansGrid) {
        return;
    }


    if (
        !Array.isArray(plans) ||
        plans.length === 0
    ) {

        plansGrid.innerHTML = `

            <div class="state-panel">

                <div class="state-icon error">
                    !
                </div>

                <strong>
                    No subscription plans available
                </strong>

                <span>
                    The server did not return any subscription plans.
                </span>

            </div>

        `;

        return;

    }


    const currentPlan =
        String(
            subscription.plan ||
            ''
        )
        .toLowerCase();


    plansGrid.innerHTML =
        plans
            .map(
                function(plan) {

                    const name =
                        String(
                            plan.name ||
                            ''
                        );


                    const lowerName =
                        name.toLowerCase();


                    const isCurrent =
                        lowerName ===
                        currentPlan;


                    const amount =
                        Number(
                            plan.amountNaira ||
                            0
                        );


                    const duration =
                        getDurationText(
                            plan
                        );


                    const description =
                        getPlanDescription(
                            name
                        );


                    const benefits =
                        getPlanBenefits(
                            name
                        );


                    const isPopular =
                        lowerName ===
                        'standard';


                    const benefitsHtml =
                        benefits
                            .map(
                                function(benefit) {

                                    return `

                                        <li>
                                            ${escapeHtml(
                                                benefit
                                            )}
                                        </li>

                                    `;

                                }
                            )
                            .join('');


                    if (
                        lowerName ===
                        'free'
                    ) {

                        return `

                            <article
                                class="plan-card plan-free ${
                                    isCurrent
                                        ? 'current'
                                        : ''
                                }"
                            >

                                ${
                                    isCurrent
                                        ? `
                                            <span class="plan-card-badge">
                                                CURRENT
                                            </span>
                                          `
                                        : ''
                                }

                                <div class="plan-name">
                                    Free
                                </div>

                                <div class="plan-price">
                                    ₦0
                                </div>

                                <div class="plan-duration">
                                    40-minute trial
                                </div>

                                <p class="plan-description">
                                    ${escapeHtml(
                                        description
                                    )}
                                </p>

                                <ul class="plan-benefits">
                                    ${benefitsHtml}
                                </ul>

                                <button
                                    type="button"
                                    class="plan-button secondary"
                                    disabled
                                >
                                    ${
                                        isCurrent
                                            ? 'Current Plan'
                                            : 'Free Trial'
                                    }
                                </button>

                            </article>

                        `;

                    }


                    return `

                        <article
                            class="plan-card ${
                                isCurrent
                                    ? 'current'
                                    : ''
                            } ${
                                isPopular
                                    ? 'popular'
                                    : ''
                            }"
                        >

                            ${
                                isCurrent
                                    ? `
                                        <span class="plan-card-badge">
                                            CURRENT
                                        </span>
                                      `
                                    : isPopular
                                        ? `
                                            <span class="plan-card-badge popular">
                                                POPULAR
                                            </span>
                                          `
                                        : ''
                            }


                            <div class="plan-name">
                                ${escapeHtml(
                                    name
                                )}
                            </div>


                            <div class="plan-price">
                                ${formatNaira(
                                    amount
                                )}
                            </div>


                            <div class="plan-duration">
                                ${escapeHtml(
                                    duration
                                )}
                            </div>


                            <p class="plan-description">
                                ${escapeHtml(
                                    description
                                )}
                            </p>


                            <ul class="plan-benefits">
                                ${benefitsHtml}
                            </ul>


                            <button
                                type="button"
                                class="plan-button"
                                data-plan="${escapeHtml(
                                    name
                                )}"
                                ${
                                    isCurrent
                                        ? 'disabled'
                                        : ''
                                }
                            >

                                ${
                                    isCurrent
                                        ? 'Current Plan'
                                        : 'Choose ' +
                                          escapeHtml(
                                              name
                                          )
                                }

                            </button>

                        </article>

                    `;

                }
            )
            .join('');


    const buttons =
        plansGrid.querySelectorAll(
            '.plan-button[data-plan]'
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                'click',
                function() {

                    const plan =
                        button.dataset.plan;


                    startPayment(
                        plan,
                        button
                    );

                }
            );

        }
    );

}


/* ============================================================
   PLAN DESCRIPTION
============================================================ */

function getPlanDescription(
    planName
) {

    const name =
        String(
            planName ||
            ''
        )
        .toLowerCase();


    if (
        name === 'free'
    ) {

        return 'Try the system before choosing a paid subscription.';

    }


    if (
        name === 'basic'
    ) {

        return 'Essential school result management for one academic term.';

    }


    if (
        name === 'standard'
    ) {

        return 'Complete school result management for one full year.';

    }


    if (
        name === 'premium'
    ) {

        return 'Extended school result management access for one full year.';

    }


    return 'School Results System subscription plan.';

}


/* ============================================================
   START PAYMENT
============================================================ */

async function startPayment(
    plan,
    button
) {

    const session =
        getStoredSession();


    if (
        !session ||
        !session.schoolId
    ) {

        redirectToLogin();

        return;

    }


    const normalizedPlan =
        String(
            plan ||
            ''
        )
        .trim();


    if (!normalizedPlan) {

        return;

    }


    const confirmed =
        window.confirm(
            `Continue with the ${normalizedPlan} plan?`
        );


    if (!confirmed) {
        return;
    }


    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        'Preparing payment...';


    hidePaymentMessage();


    try {

        const result =
            await apiRequest(
                'initializePaystackPayment',
                {

                    schoolId:
                        session.schoolId,

                    plan:
                        normalizedPlan

                }
            );


        const payment =
            result.payment ||
            (
                result.data &&
                result.data.payment
            );


        if (!payment) {

            throw new Error(
                'The payment server did not return a payment session.'
            );

        }


        /*
         * Preferred method:
         * Paystack access code.
         */
        if (
            payment.accessCode
        ) {

            button.textContent =
                'Opening payment...';


            openPaystackPopup(
                payment.accessCode,
                payment.reference,
                normalizedPlan,
                button,
                originalText
            );

            return;

        }


        /*
         * Fallback:
         * If the backend returns only an
         * authorization URL, open it.
         */
        if (
            payment.authorizationUrl
        ) {

            window.location.href =
                payment.authorizationUrl;

            return;

        }


        throw new Error(
            'Paystack did not return a valid payment session.'
        );


    } catch (error) {

        console.error(
            'Payment initialization error:',
            error
        );


        button.disabled =
            false;

        button.textContent =
            originalText;


        showPaymentMessage(
            'error',
            'Payment could not start',
            error.message ||
            'Unable to initialize the payment.'
        );

    }

}


/* ============================================================
   OPEN PAYSTACK POPUP
============================================================ */

function openPaystackPopup(
    accessCode,
    reference,
    plan,
    button,
    originalText
) {

    if (
        !window.PaystackPop
    ) {

        button.disabled =
            false;

        button.textContent =
            originalText;


        showPaymentMessage(
            'error',
            'Payment unavailable',
            'Paystack could not be loaded. Please refresh the page and try again.'
        );

        return;

    }


    try {

        const popup =
            new PaystackPop();


        popup.resumeTransaction(
            accessCode,
            {

                onSuccess:
                    function(transaction) {

                        handlePaymentSuccess(
                            transaction,
                            reference,
                            plan,
                            button
                        );

                    },


                onCancel:
                    function() {

                        button.disabled =
                            false;

                        button.textContent =
                            originalText;


                        showPaymentMessage(
                            'error',
                            'Payment cancelled',
                            'The payment was cancelled. Your subscription has not been changed.'
                        );

                    }

            }
        );


    } catch (error) {

        console.error(
            'Paystack popup error:',
            error
        );


        button.disabled =
            false;

        button.textContent =
            originalText;


        showPaymentMessage(
            'error',
            'Payment could not open',
            error.message ||
            'Unable to open Paystack checkout.'
        );

    }

}


/* ============================================================
   PAYMENT SUCCESS
============================================================ */

async function handlePaymentSuccess(
    transaction,
    fallbackReference,
    plan,
    button
) {

    const reference =
        (
            transaction &&
            transaction.reference
        ) ||
        fallbackReference;


    if (!reference) {

        button.disabled =
            false;

        button.textContent =
            'Try Again';


        showPaymentMessage(
            'error',
            'Verification required',
            'Paystack completed the checkout, but no transaction reference was returned.'
        );

        return;

    }


    button.disabled =
        true;

    button.textContent =
        'Verifying...';


    showPaymentMessage(
        'success',
        'Payment received',
        'Your payment was received. We are verifying the transaction now.'
    );


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
            !result ||
            result.paid !== true
        ) {

            throw new Error(
                result.message ||
                result.error ||
                'The payment could not be verified.'
            );

        }


        const session =
            getStoredSession();


        const subscriptionResult =
            await apiRequest(
                'getSchoolSubscription',
                {

                    schoolId:
                        session.schoolId

                }
            );


        const subscription =
            extractSubscription(
                subscriptionResult
            );


        if (subscription) {

            renderSubscription(
                subscription
            );

        }


        const activatedPlan =
            result.subscription &&
            result.subscription.plan
                ? result.subscription.plan
                : plan;


        showPaymentMessage(
            'success',
            'Subscription activated',
            `Your ${activatedPlan} plan has been activated successfully.`
        );


        button.textContent =
            'Activated';


        /*
         * Re-render the plans so the newly
         * activated plan becomes Current Plan.
         */
        const plansResult =
            await apiRequest(
                'getSubscriptionPlans'
            );


        renderPlans(
            extractPlans(
                plansResult
            ),
            subscription || {}
        );


    } catch (error) {

        console.error(
            'Payment verification error:',
            error
        );


        button.disabled =
            false;

        button.textContent =
            'Try Again';


        showPaymentMessage(
            'error',
            'Verification failed',
            error.message ||
            'The payment could not be verified yet. Please do not pay again until the transaction has been checked.'
        );

    }

}


/* ============================================================
   PAYMENT MESSAGE
============================================================ */

function showPaymentMessage(
    type,
    title,
    message
) {

    const container =
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


    if (!container) {
        return;
    }


    container.classList.remove(
        'hidden',
        'success',
        'error'
    );


    container.classList.add(
        type
    );


    if (icon) {

        icon.textContent =
            type === 'success'
                ? '✓'
                : '!';

    }


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (textElement) {

        textElement.textContent =
            message;

    }

}


/* ============================================================
   HIDE PAYMENT MESSAGE
============================================================ */

function hidePaymentMessage() {

    const container =
        document.getElementById(
            'paymentMessage'
        );


    if (container) {

        container.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

    if (menuButton) {

        menuButton.addEventListener(
            'click',
            function() {

                if (sidebar) {

                    sidebar.classList.toggle(
                        'open'
                    );

                }


                if (sidebarOverlay) {

                    sidebarOverlay.classList.toggle(
                        'visible'
                    );

                }

            }
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            'click',
            closeMobileSidebar
        );

    }


    document
        .querySelectorAll(
            '.nav-link'
        )
        .forEach(
            function(link) {

                link.addEventListener(
                    'click',
                    closeMobileSidebar
                );

            }
        );

}


/* ============================================================
   CLOSE SIDEBAR
============================================================ */

function closeMobileSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            'open'
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            'visible'
        );

    }

}


/* ============================================================
   LOGOUT
============================================================ */

function setupLogout() {

    if (!sidebarLogoutButton) {
        return;
    }


    sidebarLogoutButton.addEventListener(
        'click',
        function() {

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
                '/';

        }
    );

}


/* ============================================================
   RETRY
============================================================ */

function setupRetry() {

    if (!retryButton) {
        return;
    }


    retryButton.addEventListener(
        'click',
        loadBilling
    );

}


/* ============================================================
   STATES
============================================================ */

function showLoading() {

    if (pageLoading) {

        pageLoading.classList.remove(
            'hidden'
        );

    }


    if (billingContent) {

        billingContent.classList.add(
            'hidden'
        );

    }


    if (billingError) {

        billingError.classList.add(
            'hidden'
        );

    }

}


function showBilling() {

    if (pageLoading) {

        pageLoading.classList.add(
            'hidden'
        );

    }


    if (billingError) {

        billingError.classList.add(
            'hidden'
        );

    }


    if (billingContent) {

        billingContent.classList.remove(
            'hidden'
        );

    }

}


function showBillingError(
    message
) {

    if (pageLoading) {

        pageLoading.classList.add(
            'hidden'
        );

    }


    if (billingContent) {

        billingContent.classList.add(
            'hidden'
        );

    }


    if (billingErrorMessage) {

        billingErrorMessage.textContent =
            message;

    }


    if (billingError) {

        billingError.classList.remove(
            'hidden'
        );

    }

}


/* ============================================================
   PLAN HELPERS
============================================================ */

function getDurationText(
    plan
) {

    const type =
        String(
            plan.durationType ||
            ''
        ).toLowerCase();


    if (
        type === 'trial'
    ) {

        return '40-minute trial';

    }


    if (
        type === 'term'
    ) {

        return '1 academic term';

    }


    if (
        type === 'year'
    ) {

        return '1 year';

    }


    return 'Subscription';

}


/* ============================================================
   FORMAT PLAN
============================================================ */

function formatPlan(
    plan
) {

    const value =
        String(
            plan ||
            ''
        ).trim();


    if (!value) {

        return 'No plan';

    }


    return `${value} Plan`;

}


/* ============================================================
   FORMAT NAIRA
============================================================ */

function formatNaira(
    amount
) {

    return new Intl.NumberFormat(
        'en-NG',
        {

            style:
                'currency',

            currency:
                'NGN',

            maximumFractionDigits:
                0

        }
    ).format(
        Number(
            amount ||
            0
        )
    );

}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(
    value
) {

    if (!value) {
        return '';
    }


    const date =
        new Date(
            value
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date.toLocaleDateString(
        'en-NG',
        {

            day:
                'numeric',

            month:
                'short',

            year:
                'numeric'

        }

    );

}


/* ============================================================
   SET TEXT
============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value === null ||
        value === undefined ||
        value === ''
            ? '—'
            : String(
                value
              );

}


/* ============================================================
   INITIALS
============================================================ */

function getInitials(
    name
) {

    const value =
        String(
            name ||
            ''
        ).trim();


    if (!value) {

        return '--';

    }


    const parts =
        value.split(
            /\s+/
        );


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[
            parts.length - 1
        ].charAt(0)
    ).toUpperCase();

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value === null ||
        value === undefined
            ? ''
            : value
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
