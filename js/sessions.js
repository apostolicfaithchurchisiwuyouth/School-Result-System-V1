/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: sessions.js
 * VERSION: 1.1.0
 *
 * PURPOSE:
 * Academic session management frontend.
 *
 * FIXES:
 * - Correctly reads Apps Script "error" responses.
 * - Provides useful API error messages.
 * - Handles non-JSON server responses safely.
 * - Preserves session creation and activation logic.
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
   STATE
============================================================ */

let sessions = [];


/* ============================================================
   DOM
============================================================ */

const sidebar =
    document.getElementById('sidebar');

const menuButton =
    document.getElementById('menuButton');

const sidebarOverlay =
    document.getElementById('sidebarOverlay');

const logoutButton =
    document.getElementById('logoutButton');

const sessionModal =
    document.getElementById('sessionModal');

const openCreateButton =
    document.getElementById('openCreateButton');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const sessionForm =
    document.getElementById('sessionForm');

const formError =
    document.getElementById('formError');

const saveButton =
    document.getElementById('saveButton');

const tableWrapper =
    document.getElementById('tableWrapper');

const recordCount =
    document.getElementById('recordCount');

const pageMessage =
    document.getElementById('pageMessage');

const messageText =
    document.getElementById('messageText');

const closeMessage =
    document.getElementById('closeMessage');


/* ============================================================
   START
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initialize
);


/* ============================================================
   INITIALIZE
============================================================ */

function initialize() {

    const session =
        getStoredSession();


    if (
        !session ||
        !session.schoolId
    ) {

        redirectToLogin();

        return;

    }


    populateUser(
        session
    );


    setupNavigation();

    setupModal();

    setupForm();

    setupLogout();

    loadSessions();

}


/* ============================================================
   SESSION STORAGE
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


        return JSON.parse(raw);

    } catch (error) {

        console.error(
            'Session error:',
            error
        );

        return null;

    }

}


/* ============================================================
   LOGIN REDIRECT
============================================================ */

function redirectToLogin() {

    window.location.href =
        'index.html';

}


/* ============================================================
   USER
============================================================ */

function populateUser(
    session
) {

    const name =
        session.fullName ||
        'User';

    const role =
        session.role ||
        'User';


    document.getElementById(
        'userName'
    ).textContent =
        name;


    document.getElementById(
        'userRole'
    ).textContent =
        role;


    document.getElementById(
        'schoolName'
    ).textContent =
        session.schoolName ||
        'School Results System';


    document.getElementById(
        'userInitials'
    ).textContent =
        getInitials(name);

}


/* ============================================================
   API
============================================================ */

async function apiRequest(
    action,
    data = {}
) {

    if (
        !API_URL ||
        API_URL ===
            'YOUR_APPS_SCRIPT_WEB_APP_URL'
    ) {

        throw new Error(
            'Apps Script Web App URL has not been configured.'
        );

    }


    let response;


    try {

        response =
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
                        JSON.stringify({

                            action:
                                action,

                            ...data

                        })

                }
            );

    } catch (error) {

        console.error(
            'Network error:',
            error
        );

        throw new Error(
            'Could not connect to the School Results System server.'
        );

    }


    /*
     * Read the response as text first.
     *
     * This allows us to see the actual Apps Script
     * response even if it is not valid JSON.
     */

    const responseText =
        await response.text();


    console.log(
        `API response [${action}]:`,
        responseText
    );


    /*
     * HTTP-level failure.
     */

    if (!response.ok) {

        throw new Error(
            `Server request failed (${response.status}).`
        );

    }


    let result;


    try {

        result =
            JSON.parse(
                responseText
            );

    } catch (error) {

        console.error(
            'Invalid JSON response:',
            responseText
        );

        throw new Error(
            'The server returned an invalid response.'
        );

    }


    /*
     * IMPORTANT:
     *
     * Apps Script jsonResponse() returns:
     *
     * {
     *   success: false,
     *   error: "Actual error here"
     * }
     *
     * The old frontend was looking only for
     * result.message, which caused the useful
     * backend error to become "Request failed."
     */

    if (
        result &&
        result.success === false
    ) {

        const serverError =
            result.error ||
            result.message ||
            result.details ||
            result.statusMessage ||
            'Request failed.';


        console.error(
            `API error [${action}]:`,
            serverError,
            result
        );


        throw new Error(
            String(serverError)
        );

    }


    return result;

}


/* ============================================================
   LOAD SESSIONS
============================================================ */

async function loadSessions() {

    showTableLoading();


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


        const result =
            await apiRequest(
                'getSessions',
                {
                    schoolId:
                        session.schoolId
                }
            );


        sessions =
            extractSessions(result);


        renderSessions();

        updateActiveSession();


    } catch (error) {

        console.error(
            'Load sessions error:',
            error
        );


        showTableError(
            error.message ||
            'Unable to load sessions.'
        );

    }

}


/* ============================================================
   EXTRACT SESSIONS
============================================================ */

function extractSessions(
    result
) {

    if (!result) {
        return [];
    }


    if (
        Array.isArray(
            result.sessions
        )
    ) {

        return result.sessions;

    }


    if (
        result.data &&
        Array.isArray(
            result.data.sessions
        )
    ) {

        return result.data.sessions;

    }


    if (
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }


    if (
        Array.isArray(
            result.results
        )
    ) {

        return result.results;

    }


    return [];

}


/* ============================================================
   RENDER
============================================================ */

function renderSessions() {

    recordCount.textContent =
        `${sessions.length} ${
            sessions.length === 1
                ? 'session'
                : 'sessions'
        }`;


    if (
        sessions.length === 0
    ) {

        tableWrapper.innerHTML = `

            <div class="empty-state">

                <strong>
                    No academic sessions yet
                </strong>

                <span>
                    Create your first session
                    to begin setting up the school.
                </span>

            </div>

        `;

        return;

    }


    const sorted =
        [...sessions].sort(
            function(a, b) {

                const dateA =
                    new Date(
                        a.startDate ||
                        a['Start Date'] ||
                        0
                    ).getTime();

                const dateB =
                    new Date(
                        b.startDate ||
                        b['Start Date'] ||
                        0
                    ).getTime();

                return dateB - dateA;

            }
        );


    tableWrapper.innerHTML = `

        <table class="sessions-table">

            <thead>

                <tr>

                    <th>
                        Session
                    </th>

                    <th>
                        Start Date
                    </th>

                    <th>
                        End Date
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Action
                    </th>

                </tr>

            </thead>

            <tbody>

                ${sorted
                    .map(renderSessionRow)
                    .join('')}

            </tbody>

        </table>

    `;


    document
        .querySelectorAll(
            '.activate-button'
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    'click',
                    function() {

                        const sessionId =
                            button.dataset.sessionId;


                        activateSession(
                            sessionId
                        );

                    }
                );

            }
        );

}


/* ============================================================
   SESSION ROW
============================================================ */

function renderSessionRow(
    session
) {

    const id =
        session.sessionId ||
        session['Session ID'] ||
        '';


    const name =
        session.sessionName ||
        session['Session Name'] ||
        'Unnamed Session';


    const start =
        session.startDate ||
        session['Start Date'];


    const end =
        session.endDate ||
        session['End Date'];


    const status =
        String(
            session.status ||
            session['Status'] ||
            ''
        ).trim();


    const active =
        status.toLowerCase() ===
        'active';


    return `

        <tr>

            <td class="session-name-cell">
                ${escapeHtml(name)}
            </td>

            <td class="date-cell">
                ${escapeHtml(
                    formatDate(start) || '—'
                )}
            </td>

            <td class="date-cell">
                ${escapeHtml(
                    formatDate(end) || '—'
                )}
            </td>

            <td>

                <span
                    class="status-badge ${
                        active
                            ? 'active'
                            : ''
                    }"
                >
                    ${escapeHtml(
                        status || 'Inactive'
                    )}
                </span>

            </td>

            <td>

                ${
                    active
                        ? `
                            <span
                                class="current-label"
                            >
                                Current
                            </span>
                          `
                        : `
                            <button
                                type="button"
                                class="activate-button"
                                data-session-id="${escapeHtml(id)}"
                            >
                                Make Active
                            </button>
                          `
                }

            </td>

        </tr>

    `;

}


/* ============================================================
   ACTIVE SESSION
============================================================ */

function updateActiveSession() {

    const active =
        sessions.find(
            function(session) {

                const status =
                    String(
                        session.status ||
                        session['Status'] ||
                        ''
                    )
                    .trim()
                    .toLowerCase();


                return status === 'active';

            }
        );


    const nameElement =
        document.getElementById(
            'activeSessionName'
        );

    const datesElement =
        document.getElementById(
            'activeSessionDates'
        );

    const badge =
        document.getElementById(
            'activeBadge'
        );


    if (!active) {

        nameElement.textContent =
            'No active session';

        datesElement.textContent =
            'Create an academic session to get started.';

        badge.textContent =
            'No Active Session';

        badge.classList.remove(
            'active'
        );

        return;

    }


    const name =
        active.sessionName ||
        active['Session Name'] ||
        'Active Session';


    const start =
        active.startDate ||
        active['Start Date'];


    const end =
        active.endDate ||
        active['End Date'];


    nameElement.textContent =
        name;


    datesElement.textContent =
        `${formatDate(start)} — ${formatDate(end)}`;


    badge.textContent =
        'Active';


    badge.classList.add(
        'active'
    );

}


/* ============================================================
   CREATE SESSION
============================================================ */

async function createSession() {

    clearFormError();


    const sessionName =
        document.getElementById(
            'sessionName'
        ).value.trim();


    const startDate =
        document.getElementById(
            'startDate'
        ).value;


    const endDate =
        document.getElementById(
            'endDate'
        ).value;


    if (!sessionName) {

        showFormError(
            'Session name is required.'
        );

        return;

    }


    if (!startDate) {

        showFormError(
            'Start date is required.'
        );

        return;

    }


    if (!endDate) {

        showFormError(
            'End date is required.'
        );

        return;

    }


    if (endDate < startDate) {

        showFormError(
            'End date cannot be earlier than the start date.'
        );

        return;

    }


    const storedSession =
        getStoredSession();


    if (
        !storedSession ||
        !storedSession.schoolId
    ) {

        redirectToLogin();

        return;

    }


    setSaving(true);


    try {

        await apiRequest(
            'createSession',
            {

                schoolId:
                    storedSession.schoolId,

                sessionName:
                    sessionName,

                startDate:
                    startDate,

                endDate:
                    endDate

            }
        );


        closeModal();

        sessionForm.reset();


        showMessage(
            'Academic session created successfully.',
            'success'
        );


        await loadSessions();


    } catch (error) {

        console.error(
            'Create session error:',
            error
        );


        showFormError(
            error.message ||
            'Unable to create session.'
        );

    } finally {

        setSaving(false);

    }

}


/* ============================================================
   ACTIVATE SESSION
============================================================ */

async function activateSession(
    sessionId
) {

    if (!sessionId) {
        return;
    }


    const selected =
        sessions.find(
            function(session) {

                return (
                    String(
                        session.sessionId ||
                        session['Session ID'] ||
                        ''
                    ) ===
                    String(sessionId)
                );

            }
        );


    const name =
        selected
            ? (
                selected.sessionName ||
                selected['Session Name'] ||
                'this session'
            )
            : 'this session';


    const confirmed =
        window.confirm(
            `Make "${name}" the active academic session?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const storedSession =
            getStoredSession();


        if (
            !storedSession ||
            !storedSession.schoolId
        ) {

            redirectToLogin();

            return;

        }


        await apiRequest(
            'setActiveSession',
            {

                schoolId:
                    storedSession.schoolId,

                sessionId:
                    sessionId

            }
        );


        showMessage(
            'Academic session is now active.',
            'success'
        );


        await loadSessions();


    } catch (error) {

        console.error(
            'Activate session error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to activate session.',
            'error'
        );

    }

}


/* ============================================================
   MODAL
============================================================ */

function setupModal() {

    openCreateButton.addEventListener(
        'click',
        openModal
    );


    closeModalButton.addEventListener(
        'click',
        closeModal
    );


    cancelButton.addEventListener(
        'click',
        closeModal
    );


    sessionModal.addEventListener(
        'click',
        function(event) {

            if (
                event.target ===
                sessionModal
            ) {

                closeModal();

            }

        }
    );

}


function openModal() {

    clearFormError();


    sessionModal.classList.remove(
        'hidden'
    );


    setTimeout(
        function() {

            document
                .getElementById(
                    'sessionName'
                )
                .focus();

        },
        50
    );

}


function closeModal() {

    sessionModal.classList.add(
        'hidden'
    );


    clearFormError();

    sessionForm.reset();

}


/* ============================================================
   FORM
============================================================ */

function setupForm() {

    sessionForm.addEventListener(
        'submit',
        function(event) {

            event.preventDefault();

            createSession();

        }
    );

}


function setSaving(
    saving
) {

    saveButton.disabled =
        saving;


    saveButton.textContent =
        saving
            ? 'Creating...'
            : 'Create Session';

}


function showFormError(
    message
) {

    formError.textContent =
        message;


    formError.classList.remove(
        'hidden'
    );

}


function clearFormError() {

    formError.textContent =
        '';


    formError.classList.add(
        'hidden'
    );

}


/* ============================================================
   MESSAGES
============================================================ */

function showMessage(
    message,
    type
) {

    messageText.textContent =
        message;


    pageMessage.className =
        `page-message ${type}`;


    pageMessage.classList.remove(
        'hidden'
    );


    setTimeout(
        function() {

            pageMessage.classList.add(
                'hidden'
            );

        },
        4500
    );

}


closeMessage.addEventListener(
    'click',
    function() {

        pageMessage.classList.add(
            'hidden'
        );

    }
);


/* ============================================================
   LOADING / ERROR
============================================================ */

function showTableLoading() {

    tableWrapper.innerHTML = `

        <div class="loading-state">

            <div class="spinner"></div>

            <span>
                Loading sessions...
            </span>

        </div>

    `;

}


function showTableError(
    message
) {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                Could not load sessions
            </strong>

            <span>
                ${escapeHtml(
                    message ||
                    'Please try again.'
                )}
            </span>

        </div>

    `;

}


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

    menuButton.addEventListener(
        'click',
        function() {

            sidebar.classList.toggle(
                'open'
            );


            sidebarOverlay.classList.toggle(
                'visible'
            );

        }
    );


    sidebarOverlay.addEventListener(
        'click',
        closeMobileSidebar
    );


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


function closeMobileSidebar() {

    sidebar.classList.remove(
        'open'
    );


    sidebarOverlay.classList.remove(
        'visible'
    );

}


/* ============================================================
   LOGOUT
============================================================ */

function setupLogout() {

    logoutButton.addEventListener(
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
                'index.html';

        }
    );

}


/* ============================================================
   HELPERS
============================================================ */

function getInitials(
    name
) {

    const value =
        String(
            name || ''
        ).trim();


    if (!value) {
        return '--';
    }


    const parts =
        value.split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


function formatDate(
    value
) {

    if (!value) {
        return '';
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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
