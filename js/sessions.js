/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/sessions.js
 * VERSION: 2.1.0
 *
 * PURPOSE:
 * Academic session management.
 *
 * API communication is handled ONLY by /js/api.js.
 * ============================================================
 */

(function () {
    'use strict';

    const SESSION_KEY =
        'school_results_system_session_v1';

    const LOGIN_PAGE =
        '/index.html';

    let sessions = [];

    /* --------------------------------------------------------
       DOM
    -------------------------------------------------------- */

    const sidebar =
        document.getElementById('sidebar');

    const menuButton =
        document.getElementById('menuButton');

    const overlay =
        document.getElementById('sidebarOverlay');

    const logoutButton =
        document.getElementById('logoutButton');

    const sessionModal =
        document.getElementById('sessionModal');

    const sessionForm =
        document.getElementById('sessionForm');

    const sessionsTableBody =
        document.getElementById('sessionsTableBody');

    const messageElement =
        document.getElementById('sessionMessage');

    const activeSessionElement =
        document.getElementById('activeSession');

    const createSessionButton =
        document.getElementById('createSessionButton');


    /* --------------------------------------------------------
       INITIALIZE
    -------------------------------------------------------- */

    async function initialize() {

        const session =
            getStoredSession();

        if (
            !session ||
            !session.schoolId
        ) {
            redirectToLogin();
            return;
        }

        populateUser(session);
        setupNavigation();
        setupModal();
        setupForm();
        setupLogout();

        await loadSessions(session);
    }


    /* --------------------------------------------------------
       SESSION
    -------------------------------------------------------- */

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
                'Session read error:',
                error
            );

            localStorage.removeItem(
                SESSION_KEY
            );

            return null;
        }
    }


    function redirectToLogin() {

        window.location.replace(
            LOGIN_PAGE
        );
    }


    /* --------------------------------------------------------
       USER
    -------------------------------------------------------- */

    function populateUser(session) {

        const name =
            session.fullName ||
            'Administrator';

        const role =
            session.role ||
            'Administrator';

        const schoolName =
            session.schoolName ||
            '';

        const userNameElements =
            document.querySelectorAll(
                '[data-user-name], .user-name'
            );

        userNameElements.forEach(
            function (element) {
                element.textContent = name;
            }
        );

        const roleElements =
            document.querySelectorAll(
                '[data-user-role], .user-role'
            );

        roleElements.forEach(
            function (element) {
                element.textContent = role;
            }
        );

        const schoolElements =
            document.querySelectorAll(
                '[data-school-name], .school-name'
            );

        schoolElements.forEach(
            function (element) {
                element.textContent =
                    schoolName;
            }
        );

        const initials =
            getInitials(name);

        document
            .querySelectorAll(
                '[data-user-initials], .user-initials'
            )
            .forEach(
                function (element) {
                    element.textContent =
                        initials;
                }
            );
    }


    function getInitials(name) {

        return String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0)
                    .toUpperCase();
            })
            .join('');
    }


    /* --------------------------------------------------------
       LOAD SESSIONS
    -------------------------------------------------------- */

    async function loadSessions(session) {

        setPageLoading(true);
        clearMessage();

        try {

            const result =
                await window.schoolResultsAPI.request(
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

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {

            setPageLoading(false);
        }
    }


    function extractSessions(result) {

        if (!result) {
            return [];
        }

        if (
            Array.isArray(result)
        ) {
            return result;
        }

        if (
            Array.isArray(result.sessions)
        ) {
            return result.sessions;
        }

        if (
            result.data &&
            Array.isArray(result.data)
        ) {
            return result.data;
        }

        if (
            result.data &&
            Array.isArray(result.data.sessions)
        ) {
            return result.data.sessions;
        }

        return [];
    }


    /* --------------------------------------------------------
       RENDER
    -------------------------------------------------------- */

    function renderSessions() {

        if (!sessionsTableBody) {
            return;
        }

        const sorted =
            [...sessions].sort(
                function (a, b) {

                    const dateA =
                        new Date(
                            getSessionStartDate(a)
                        ).getTime() || 0;

                    const dateB =
                        new Date(
                            getSessionStartDate(b)
                        ).getTime() || 0;

                    return dateB - dateA;
                }
            );

        if (!sorted.length) {

            sessionsTableBody.innerHTML =
                `
                <tr>
                    <td colspan="6">
                        No academic sessions found.
                    </td>
                </tr>
                `;

            return;
        }

        sessionsTableBody.innerHTML =
            sorted
                .map(renderSessionRow)
                .join('');

        bindActivationButtons();
    }


    function renderSessionRow(session) {

        const id =
            getSessionId(session);

        const name =
            getSessionName(session);

        const start =
            getSessionStartDate(session);

        const end =
            getSessionEndDate(session);

        const status =
            getSessionStatus(session);

        const active =
            isActiveSession(session);

        return `
            <tr>
                <td>
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${formatDate(start)}
                </td>

                <td>
                    ${formatDate(end)}
                </td>

                <td>
                    <span class="session-status ${active ? 'active' : ''}">
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    ${
                        active
                            ? '<span>Current Session</span>'
                            : `
                                <button
                                    type="button"
                                    class="activate-button"
                                    data-session-id="${escapeHtml(id)}"
                                >
                                    Activate
                                </button>
                              `
                    }
                </td>
            </tr>
        `;
    }


    function bindActivationButtons() {

        document
            .querySelectorAll(
                '.activate-button'
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        function () {

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


    /* --------------------------------------------------------
       CREATE
    -------------------------------------------------------- */

    async function createSession() {

        const storedSession =
            getStoredSession();

        if (
            !storedSession ||
            !storedSession.schoolId
        ) {
            redirectToLogin();
            return;
        }

        const sessionName =
            getInputValue(
                'sessionName'
            );

        const startDate =
            getInputValue(
                'startDate'
            );

        const endDate =
            getInputValue(
                'endDate'
            );

        if (!sessionName) {

            showMessage(
                'Please enter the academic session name.',
                'error'
            );

            return;
        }

        if (!startDate) {

            showMessage(
                'Please select a start date.',
                'error'
            );

            return;
        }

        if (!endDate) {

            showMessage(
                'Please select an end date.',
                'error'
            );

            return;
        }

        if (
            new Date(startDate) >
            new Date(endDate)
        ) {

            showMessage(
                'The start date cannot be after the end date.',
                'error'
            );

            return;
        }

        setFormLoading(true);
        clearMessage();

        try {

            await window.schoolResultsAPI.request(
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

            showMessage(
                'Academic session created successfully.',
                'success'
            );

            resetForm();
            closeModal();

            await loadSessions(
                storedSession
            );

        } catch (error) {

            console.error(
                'Create session error:',
                error
            );

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {

            setFormLoading(false);
        }
    }


    /* --------------------------------------------------------
       ACTIVATE
    -------------------------------------------------------- */

    async function activateSession(sessionId) {

        if (!sessionId) {
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

        const selectedSession =
            sessions.find(
                function (session) {
                    return String(
                        getSessionId(session)
                    ) === String(sessionId);
                }
            );

        const sessionName =
            selectedSession
                ? getSessionName(selectedSession)
                : 'this session';

        const confirmed =
            window.confirm(
                `Activate "${sessionName}" as the current academic session?`
            );

        if (!confirmed) {
            return;
        }

        setPageLoading(true);
        clearMessage();

        try {

            await window.schoolResultsAPI.request(
                'setActiveSession',
                {
                    schoolId:
                        storedSession.schoolId,

                    sessionId:
                        sessionId
                }
            );

            showMessage(
                'Academic session activated successfully.',
                'success'
            );

            await loadSessions(
                storedSession
            );

        } catch (error) {

            console.error(
                'Activate session error:',
                error
            );

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {

            setPageLoading(false);
        }
    }


    /* --------------------------------------------------------
       ACTIVE SESSION
    -------------------------------------------------------- */

    function updateActiveSession() {

        const active =
            sessions.find(
                isActiveSession
            );

        if (!active) {

            if (activeSessionElement) {
                activeSessionElement.textContent =
                    'No active session';
            }

            return;
        }

        if (activeSessionElement) {

            activeSessionElement.textContent =
                getSessionName(active);
        }
    }


    function isActiveSession(session) {

        const status =
            String(
                getSessionStatus(session)
            )
                .trim()
                .toLowerCase();

        return (
            status === 'active' ||
            status === 'current'
        );
    }


    /* --------------------------------------------------------
       MODAL
    -------------------------------------------------------- */

    function setupModal() {

        if (createSessionButton) {

            createSessionButton.addEventListener(
                'click',
                openModal
            );
        }

        document
            .querySelectorAll(
                '[data-close-modal], .close-modal'
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        'click',
                        closeModal
                    );
                }
            );
    }


    function openModal() {

        if (!sessionModal) {
            return;
        }

        sessionModal.hidden = false;
        sessionModal.classList.add(
            'open'
        );

        const input =
            document.getElementById(
                'sessionName'
            );

        input?.focus();
    }


    function closeModal() {

        if (!sessionModal) {
            return;
        }

        sessionModal.classList.remove(
            'open'
        );

        sessionModal.hidden = true;
    }


    /* --------------------------------------------------------
       FORM
    -------------------------------------------------------- */

    function setupForm() {

        if (!sessionForm) {
            return;
        }

        sessionForm.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

                createSession();
            }
        );
    }


    function resetForm() {

        sessionForm?.reset();
    }


    function getInputValue(id) {

        const element =
            document.getElementById(id);

        return String(
            element?.value || ''
        ).trim();
    }


    /* --------------------------------------------------------
       NAVIGATION
    -------------------------------------------------------- */

    function setupNavigation() {

        menuButton?.addEventListener(
            'click',
            function () {

                sidebar?.classList.add(
                    'open'
                );

                overlay?.classList.add(
                    'show'
                );
            }
        );

        overlay?.addEventListener(
            'click',
            closeSidebar
        );
    }


    function closeSidebar() {

        sidebar?.classList.remove(
            'open'
        );

        overlay?.classList.remove(
            'show'
        );
    }


    /* --------------------------------------------------------
       LOGOUT
    -------------------------------------------------------- */

    function setupLogout() {

        logoutButton?.addEventListener(
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

                redirectToLogin();
            }
        );
    }


    /* --------------------------------------------------------
       LOADING
    -------------------------------------------------------- */

    function setPageLoading(isLoading) {

        document.body.classList.toggle(
            'page-loading',
            isLoading
        );
    }


    function setFormLoading(isLoading) {

        const submitButton =
            sessionForm?.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {

            submitButton.disabled =
                isLoading;
        }
    }


    /* --------------------------------------------------------
       MESSAGES
    -------------------------------------------------------- */

    function showMessage(
        message,
        type = 'error'
    ) {

        if (!messageElement) {
            return;
        }

        messageElement.textContent =
            message;

        messageElement.className =
            `session-message ${type}`;

        messageElement.hidden =
            false;
    }


    function clearMessage() {

        if (!messageElement) {
            return;
        }

        messageElement.textContent =
            '';

        messageElement.hidden =
            true;
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
            'Unable to complete the request. Please try again.'
        );
    }


    /* --------------------------------------------------------
       SESSION FIELD HELPERS
    -------------------------------------------------------- */

    function getSessionId(session) {

        return (
            session.sessionId ??
            session.id ??
            session['Session ID'] ??
            ''
        );
    }


    function getSessionName(session) {

        return (
            session.sessionName ??
            session.name ??
            session['Session Name'] ??
            ''
        );
    }


    function getSessionStartDate(session) {

        return (
            session.startDate ??
            session['Start Date'] ??
            ''
        );
    }


    function getSessionEndDate(session) {

        return (
            session.endDate ??
            session['End Date'] ??
            ''
        );
    }


    function getSessionStatus(session) {

        return (
            session.status ??
            session['Status'] ??
            ''
        );
    }


    /* --------------------------------------------------------
       DATE
    -------------------------------------------------------- */

    function formatDate(value) {

        if (!value) {
            return '—';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return escapeHtml(
                String(value)
            );
        }

        return date.toLocaleDateString(
            'en-NG',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        );
    }


    /* --------------------------------------------------------
       HTML ESCAPE
    -------------------------------------------------------- */

    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


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
