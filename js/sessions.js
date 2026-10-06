/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/sessions.js
 * VERSION: 2.2.0
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
    const LOGIN_PAGE = '/';

    let sessions = [];

    /* --------------------------------------------------------
       DOM HELPERS
    -------------------------------------------------------- */

    function $(id) {
        return document.getElementById(id);
    }

    /* --------------------------------------------------------
       INITIALIZE
    -------------------------------------------------------- */

    async function initialize() {
        console.log('[Sessions] Initializing...');

        const session = getStoredSession();

        if (!session || !session.schoolId) {
            console.warn('[Sessions] No valid login session.');
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
       STORED LOGIN SESSION
    -------------------------------------------------------- */

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
            console.error('[Sessions] Session read error:', error);

            localStorage.removeItem(SESSION_KEY);

            return null;
        }
    }

    function redirectToLogin() {
        window.location.replace(LOGIN_PAGE);
    }

    /* --------------------------------------------------------
       USER DISPLAY
    -------------------------------------------------------- */

    function populateUser(session) {
        const name = session.fullName || 'Administrator';
        const role = session.role || 'Administrator';
        const schoolName = session.schoolName || '';

        document
            .querySelectorAll('[data-user-name], .user-name')
            .forEach(function (element) {
                element.textContent = name;
            });

        document
            .querySelectorAll('[data-user-role], .user-role')
            .forEach(function (element) {
                element.textContent = role;
            });

        document
            .querySelectorAll('[data-school-name], .school-name')
            .forEach(function (element) {
                element.textContent = schoolName;
            });

        const initials = getInitials(name);

        document
            .querySelectorAll('[data-user-initials], .user-initials')
            .forEach(function (element) {
                element.textContent = initials;
            });
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

    /* --------------------------------------------------------
       LOAD SESSIONS
    -------------------------------------------------------- */

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
                '[Sessions] Loading sessions for:',
                session.schoolId
            );

            const result =
                await window.schoolResultsAPI.request(
                    'getSessions',
                    {
                        schoolId: session.schoolId
                    }
                );

            console.log('[Sessions] API response:', result);

            sessions = extractSessions(result);

            console.log(
                '[Sessions] Sessions extracted:',
                sessions
            );

            renderSessions();
            updateActiveSession();

        } catch (error) {
            console.error(
                '[Sessions] Load sessions error:',
                error
            );

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {
            /*
             * IMPORTANT:
             * Always remove the page-loading state, regardless
             * of whether rendering succeeds or fails.
             */
            setPageLoading(false);

            console.log('[Sessions] Loading finished.');
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

    /* --------------------------------------------------------
       RENDER SESSIONS
    -------------------------------------------------------- */

    function renderSessions() {
        const tableBody = $('sessionsTableBody');

        if (!tableBody) {
            console.error(
                '[Sessions] sessionsTableBody was not found in the HTML.'
            );

            return;
        }

        const sorted = [...sessions].sort(function (a, b) {
            const dateA =
                new Date(
                    getSessionStartDate(a)
                ).getTime() || 0;

            const dateB =
                new Date(
                    getSessionStartDate(b)
                ).getTime() || 0;

            return dateB - dateA;
        });

        if (!sorted.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No academic sessions found.
                    </td>
                </tr>
            `;

            updateRecordCount(0);

            return;
        }

        tableBody.innerHTML =
            sorted
                .map(renderSessionRow)
                .join('');

        updateRecordCount(sorted.length);

        bindActivationButtons();
    }

    function renderSessionRow(session) {
        const id = getSessionId(session);
        const name = getSessionName(session);
        const start = getSessionStartDate(session);
        const end = getSessionEndDate(session);
        const status = getSessionStatus(session);
        const active = isActiveSession(session);

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
                        ${escapeHtml(status || 'Inactive')}
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

    /* --------------------------------------------------------
       CREATE SESSION
    -------------------------------------------------------- */

    async function createSession() {
        const storedSession = getStoredSession();

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

        if (new Date(startDate) > new Date(endDate)) {
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
                '[Sessions] Create session error:',
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
       ACTIVATE SESSION
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

    /* --------------------------------------------------------
       ACTIVE SESSION DISPLAY
    -------------------------------------------------------- */

    function updateActiveSession() {
        const active =
            sessions.find(isActiveSession);

        const activeName =
            $('activeSessionName');

        const activeDates =
            $('activeSessionDates');

        const activeBadge =
            $('activeBadge');

        if (!active) {
            if (activeName) {
                activeName.textContent =
                    'No active session';
            }

            if (activeDates) {
                activeDates.textContent =
                    '';
            }

            if (activeBadge) {
                activeBadge.textContent =
                    'No Active Session';
            }

            return;
        }

        if (activeName) {
            activeName.textContent =
                getSessionName(active);
        }

        if (activeDates) {
            activeDates.textContent =
                `${formatDate(
                    getSessionStartDate(active)
                )} – ${formatDate(
                    getSessionEndDate(active)
                )}`;
        }

        if (activeBadge) {
            activeBadge.textContent =
                'Active';
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
        const openButton =
            $('openCreateButton') ||
            $('createSessionButton');

        if (openButton) {
            openButton.addEventListener(
                'click',
                openModal
            );
        }

        document
            .querySelectorAll(
                '[data-close-modal], .close-modal'
            )
            .forEach(function (button) {
                button.addEventListener(
                    'click',
                    closeModal
                );
            });
    }

    function openModal() {
        const modal =
            $('sessionModal');

        if (!modal) {
            return;
        }

        modal.hidden = false;
        modal.classList.add('open');

        const input =
            $('sessionName');

        if (input) {
            input.focus();
        }
    }

    function closeModal() {
        const modal =
            $('sessionModal');

        if (!modal) {
            return;
        }

        modal.classList.remove('open');
        modal.hidden = true;
    }

    /* --------------------------------------------------------
       FORM
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       NAVIGATION
    -------------------------------------------------------- */

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
                    sidebar?.classList.add('open');
                    overlay?.classList.add('show');
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
        $('sidebar')?.classList.remove('open');
        $('sidebarOverlay')?.classList.remove('show');
    }

    /* --------------------------------------------------------
       LOGOUT
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       PAGE LOADING
    -------------------------------------------------------- */

    function setPageLoading(isLoading) {
        document.body.classList.toggle(
            'page-loading',
            Boolean(isLoading)
        );

        /*
         * Also support an explicit loading element if the
         * Sessions HTML contains one.
         */
        const loadingElements =
            document.querySelectorAll(
                '#loadingState, #loadingOverlay, .loading-state, .page-loader'
            );

        loadingElements.forEach(
            function (element) {
                element.hidden = !isLoading;
                element.setAttribute(
                    'aria-hidden',
                    String(!isLoading)
                );
            }
        );
    }

    function setFormLoading(isLoading) {
        const form =
            $('sessionForm');

        const submitButton =
            form?.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {
            submitButton.disabled =
                Boolean(isLoading);
        }
    }

    /* --------------------------------------------------------
       MESSAGES
    -------------------------------------------------------- */

    function showMessage(
        message,
        type = 'error'
    ) {
        const pageMessage =
            $('pageMessage');

        const messageText =
            $('messageText');

        /*
         * This matches the actual Sessions HTML.
         */
        if (pageMessage) {
            pageMessage.hidden = false;

            pageMessage.classList.remove(
                'success',
                'error',
                'warning'
            );

            pageMessage.classList.add(type);
        }

        if (messageText) {
            messageText.textContent =
                message;
        }

        /*
         * Fallback for older markup.
         */
        const oldMessage =
            $('sessionMessage');

        if (oldMessage) {
            oldMessage.textContent =
                message;

            oldMessage.className =
                `session-message ${type}`;

            oldMessage.hidden = false;
        }
    }

    function clearMessage() {
        const pageMessage =
            $('pageMessage');

        const messageText =
            $('messageText');

        if (pageMessage) {
            pageMessage.hidden = true;
        }

        if (messageText) {
            messageText.textContent = '';
        }

        const oldMessage =
            $('sessionMessage');

        if (oldMessage) {
            oldMessage.textContent = '';
            oldMessage.hidden = true;
        }
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
