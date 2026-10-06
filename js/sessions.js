/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/sessions.js
 * VERSION: 2.3.0
 *
 * PURPOSE:
 * Academic session management.
 *
 * API communication is handled ONLY by /js/api.js.
 * ============================================================
 */

(function () {
    'use strict';

    const SESSION_KEY = 'school_results_system_session_v1';
    const LOGIN_PAGE = '/index.html';

    let sessions = [];

    /* ========================================================
       DOM
    ======================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    /* ========================================================
       INITIALIZE
    ======================================================== */

    async function initialize() {
        console.log('[Sessions] Initializing...');

        const session = getStoredSession();

        if (!session || !session.schoolId) {
            redirectToLogin();
            return;
        }

        populateUser(session);
        setupNavigation();
        setupModal();
        setupForm();
        setupLogout();
        setupMessageClose();

        await loadSessions(session);
    }

    /* ========================================================
       LOGIN SESSION
    ======================================================== */

    function getStoredSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);

            if (!raw) {
                return null;
            }

            const session = JSON.parse(raw);

            if (!session || typeof session !== 'object') {
                return null;
            }

            return session;

        } catch (error) {
            console.error(
                '[Sessions] Session read error:',
                error
            );

            localStorage.removeItem(SESSION_KEY);

            return null;
        }
    }

    function redirectToLogin() {
        window.location.replace(LOGIN_PAGE);
    }

    /* ========================================================
       USER
    ======================================================== */

    function populateUser(session) {
        const name = session.fullName || 'Administrator';
        const role = session.role || 'Administrator';
        const schoolName =
            session.schoolName || 'School Results System';

        const schoolNameElement = $('schoolName');

        if (schoolNameElement) {
            schoolNameElement.textContent = schoolName;
        }

        const userNameElement = $('userName');

        if (userNameElement) {
            userNameElement.textContent = name;
        }

        const userRoleElement = $('userRole');

        if (userRoleElement) {
            userRoleElement.textContent = role;
        }

        const initialsElement = $('userInitials');

        if (initialsElement) {
            initialsElement.textContent = getInitials(name);
        }
    }

    function getInitials(name) {
        return String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0).toUpperCase();
            })
            .join('');
    }

    /* ========================================================
       LOAD SESSIONS
    ======================================================== */

    async function loadSessions(session) {
        setPageLoading(true);
        clearMessage();

        try {
            if (
                !window.schoolResultsAPI ||
                typeof window.schoolResultsAPI.request !== 'function'
            ) {
                throw new Error(
                    'The central API client is not available. Please refresh the page.'
                );
            }

            console.log(
                '[Sessions] Requesting sessions:',
                session.schoolId
            );

            const result =
                await window.schoolResultsAPI.request(
                    'getSessions',
                    {
                        schoolId: session.schoolId
                    }
                );

            console.log(
                '[Sessions] API response:',
                result
            );

            sessions = extractSessions(result);

            console.log(
                '[Sessions] Sessions found:',
                sessions.length,
                sessions
            );

            renderSessions();
            updateActiveSession();

        } catch (error) {
            console.error(
                '[Sessions] Load sessions error:',
                error
            );

            renderEmptyState(
                'Unable to load academic sessions.'
            );

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {
            setPageLoading(false);

            console.log(
                '[Sessions] Page loading finished.'
            );
        }
    }

    function extractSessions(result) {
        if (!result) {
            return [];
        }

        if (Array.isArray(result)) {
            return result;
        }

        if (Array.isArray(result.sessions)) {
            return result.sessions;
        }

        if (
            result.data &&
            Array.isArray(result.data.sessions)
        ) {
            return result.data.sessions;
        }

        if (
            result.data &&
            Array.isArray(result.data)
        ) {
            return result.data;
        }

        return [];
    }

    /* ========================================================
       RENDER
    ======================================================== */

    function renderSessions() {
        const wrapper = $('tableWrapper');

        if (!wrapper) {
            console.error(
                '[Sessions] tableWrapper was not found.'
            );

            return;
        }

        const sorted = [...sessions].sort(
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

        updateRecordCount(sorted.length);

        if (!sorted.length) {
            renderEmptyState(
                'No academic sessions found.'
            );

            return;
        }

        wrapper.innerHTML = `
            <table class="sessions-table">
                <thead>
                    <tr>
                        <th>Session</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    ${sorted
                        .map(renderSessionRow)
                        .join('')}
                </tbody>
            </table>
        `;

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
                    <strong>
                        ${escapeHtml(name)}
                    </strong>
                </td>

                <td>
                    ${formatDate(start)}
                </td>

                <td>
                    ${formatDate(end)}
                </td>

                <td>
                    <span
                        class="session-status ${
                            active ? 'active' : ''
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
                                <span class="current-session-label">
                                    Current Session
                                </span>
                              `
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

    function renderEmptyState(message) {
        const wrapper = $('tableWrapper');

        if (!wrapper) {
            return;
        }

        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ◷
                </div>

                <strong>
                    ${escapeHtml(message)}
                </strong>

                <span>
                    Create an academic session to get started.
                </span>
            </div>
        `;
    }

    function updateRecordCount(count) {
        const element = $('recordCount');

        if (!element) {
            return;
        }

        element.textContent =
            `${count} session${count === 1 ? '' : 's'}`;
    }

    function bindActivationButtons() {
        document
            .querySelectorAll('.activate-button')
            .forEach(function (button) {
                button.addEventListener(
                    'click',
                    function () {
                        activateSession(
                            button.dataset.sessionId
                        );
                    }
                );
            });
    }

    /* ========================================================
       ACTIVE SESSION
    ======================================================== */

    function updateActiveSession() {
        const active =
            sessions.find(isActiveSession);

        const nameElement =
            $('activeSessionName');

        const datesElement =
            $('activeSessionDates');

        const badgeElement =
            $('activeBadge');

        if (!active) {
            if (nameElement) {
                nameElement.textContent =
                    'No active session';
            }

            if (datesElement) {
                datesElement.textContent =
                    'Create an academic session to get started.';
            }

            if (badgeElement) {
                badgeElement.textContent =
                    'No Active Session';
            }

            return;
        }

        if (nameElement) {
            nameElement.textContent =
                getSessionName(active);
        }

        if (datesElement) {
            datesElement.textContent =
                `${formatDate(
                    getSessionStartDate(active)
                )} – ${formatDate(
                    getSessionEndDate(active)
                )}`;
        }

        if (badgeElement) {
            badgeElement.textContent = 'Active';
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

    /* ========================================================
       CREATE SESSION
    ======================================================== */

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
            getInputValue('sessionName');

        const startDate =
            getInputValue('startDate');

        const endDate =
            getInputValue('endDate');

        if (!sessionName) {
            showFormError(
                'Please enter the academic session name.'
            );
            return;
        }

        if (!startDate) {
            showFormError(
                'Please select a start date.'
            );
            return;
        }

        if (!endDate) {
            showFormError(
                'Please select an end date.'
            );
            return;
        }

        if (
            new Date(startDate) >
            new Date(endDate)
        ) {
            showFormError(
                'The start date cannot be after the end date.'
            );
            return;
        }

        setFormLoading(true);
        clearFormError();

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

            closeModal();
            resetForm();

            showMessage(
                'Academic session created successfully.',
                'success'
            );

            await loadSessions(
                storedSession
            );

        } catch (error) {
            console.error(
                '[Sessions] Create session error:',
                error
            );

            showFormError(
                getErrorMessage(error)
            );

        } finally {
            setFormLoading(false);
        }
    }

    /* ========================================================
       ACTIVATE SESSION
    ======================================================== */

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
            sessions.find(function (session) {
                return String(
                    getSessionId(session)
                ) === String(sessionId);
            });

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
                '[Sessions] Activate session error:',
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

    /* ========================================================
       MODAL
    ======================================================== */

    function setupModal() {
        const openButton =
            $('openCreateButton');

        const closeButton =
            $('closeModalButton');

        const cancelButton =
            $('cancelButton');

        if (openButton) {
            openButton.addEventListener(
                'click',
                openModal
            );
        }

        if (closeButton) {
            closeButton.addEventListener(
                'click',
                closeModal
            );
        }

        if (cancelButton) {
            cancelButton.addEventListener(
                'click',
                closeModal
            );
        }

        const modal =
            $('sessionModal');

        if (modal) {
            modal.addEventListener(
                'click',
                function (event) {
                    if (
                        event.target === modal
                    ) {
                        closeModal();
                    }
                }
            );
        }
    }

    function openModal() {
        const modal =
            $('sessionModal');

        if (!modal) {
            return;
        }

        modal.classList.remove('hidden');
        modal.hidden = false;
        modal.classList.add('open');

        clearFormError();

        const input =
            $('sessionName');

        if (input) {
            setTimeout(
                function () {
                    input.focus();
                },
                50
            );
        }
    }

    function closeModal() {
        const modal =
            $('sessionModal');

        if (!modal) {
            return;
        }

        modal.classList.remove('open');
        modal.classList.add('hidden');
        modal.hidden = true;

        clearFormError();
    }

    /* ========================================================
       FORM
    ======================================================== */

    function setupForm() {
        const form =
            $('sessionForm');

        if (!form) {
            return;
        }

        form.addEventListener(
            'submit',
            function (event) {
                event.preventDefault();

                createSession();
            }
        );
    }

    function resetForm() {
        const form =
            $('sessionForm');

        if (form) {
            form.reset();
        }
    }

    function getInputValue(id) {
        const element =
            $(id);

        return String(
            element?.value || ''
        ).trim();
    }

    function setFormLoading(isLoading) {
        const saveButton =
            $('saveButton');

        if (!saveButton) {
            return;
        }

        saveButton.disabled =
            Boolean(isLoading);

        saveButton.textContent =
            isLoading
                ? 'Creating...'
                : 'Create Session';
    }

    function showFormError(message) {
        const errorElement =
            $('formError');

        if (!errorElement) {
            showMessage(
                message,
                'error'
            );

            return;
        }

        errorElement.textContent =
            message;

        errorElement.classList.remove(
            'hidden'
        );

        errorElement.hidden = false;
    }

    function clearFormError() {
        const errorElement =
            $('formError');

        if (!errorElement) {
            return;
        }

        errorElement.textContent = '';

        errorElement.classList.add(
            'hidden'
        );

        errorElement.hidden = true;
    }

    /* ========================================================
       PAGE MESSAGE
    ======================================================== */

    function showMessage(
        message,
        type
    ) {
        const pageMessage =
            $('pageMessage');

        const messageText =
            $('messageText');

        if (!pageMessage) {
            return;
        }

        if (messageText) {
            messageText.textContent =
                message;
        }

        pageMessage.classList.remove(
            'hidden'
        );

        pageMessage.classList.remove(
            'success',
            'error',
            'warning'
        );

        pageMessage.classList.add(
            type || 'error'
        );

        pageMessage.hidden = false;
    }

    function clearMessage() {
        const pageMessage =
            $('pageMessage');

        const messageText =
            $('messageText');

        if (!pageMessage) {
            return;
        }

        if (messageText) {
            messageText.textContent = '';
        }

        pageMessage.classList.add(
            'hidden'
        );

        pageMessage.hidden = true;
    }

    function setupMessageClose() {
        const closeButton =
            $('closeMessage');

        if (!closeButton) {
            return;
        }

        closeButton.addEventListener(
            'click',
            clearMessage
        );
    }

    /* ========================================================
       NAVIGATION
    ======================================================== */

    function setupNavigation() {
        const menuButton =
            $('menuButton');

        const sidebar =
            $('sidebar');

        const overlay =
            $('sidebarOverlay');

        if (menuButton) {
            menuButton.addEventListener(
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
        }

        if (overlay) {
            overlay.addEventListener(
                'click',
                closeSidebar
            );
        }
    }

    function closeSidebar() {
        $('sidebar')?.classList.remove(
            'open'
        );

        $('sidebarOverlay')?.classList.remove(
            'show'
        );
    }

    /* ========================================================
       LOGOUT
    ======================================================== */

    function setupLogout() {
        const logoutButton =
            $('logoutButton');

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

                redirectToLogin();
            }
        );
    }

    /* ========================================================
       LOADING
    ======================================================== */

    function setPageLoading(isLoading) {
        document.body.classList.toggle(
            'page-loading',
            Boolean(isLoading)
        );

        const loadingState =
            $('tableWrapper')?.querySelector(
                '.loading-state'
            );

        if (loadingState) {
            loadingState.style.display =
                isLoading ? '' : 'none';
        }
    }

    /* ========================================================
       SESSION FIELD HELPERS
    ======================================================== */

    function getSessionId(session) {
        return (
            session?.sessionId ??
            session?.id ??
            session?.['Session ID'] ??
            ''
        );
    }

    function getSessionName(session) {
        return (
            session?.sessionName ??
            session?.name ??
            session?.['Session Name'] ??
            ''
        );
    }

    function getSessionStartDate(session) {
        return (
            session?.startDate ??
            session?.['Start Date'] ??
            ''
        );
    }

    function getSessionEndDate(session) {
        return (
            session?.endDate ??
            session?.['End Date'] ??
            ''
        );
    }

    function getSessionStatus(session) {
        return (
            session?.status ??
            session?.['Status'] ??
            ''
        );
    }

    /* ========================================================
       DATE
    ======================================================== */

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

    /* ========================================================
       HTML ESCAPE
    ======================================================== */

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ========================================================
       START
    ======================================================== */

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
