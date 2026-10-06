/* =========================================================
   SCHOOL RESULTS SYSTEM
   Sessions Page
   Version: 2.5.0
   ========================================================= */

(function () {
    'use strict';

    const SESSION_KEY = 'school_results_system_session_v1';
    const LOGIN_PAGE = '/';

    let sessions = [];
    let isCreatingSession = false;
    let isActivatingSession = false;

    /* =========================================================
       BASIC HELPERS
       ========================================================= */

    function $(id) {
        return document.getElementById(id);
    }

    function getStoredSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);

            if (!raw) {
                return null;
            }

            const session = JSON.parse(raw);

            if (!session || !session.schoolId) {
                return null;
            }

            return session;

        } catch (error) {
            console.error(
                '[Sessions] Unable to read stored login session:',
                error
            );

            return null;
        }
    }

    function redirectToLogin() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = LOGIN_PAGE;
    }

    function getErrorMessage(error) {
        if (!error) {
            return 'Something went wrong. Please try again.';
        }

        if (typeof error === 'string') {
            return error;
        }

        return (
            error.message ||
            error.error ||
            'Something went wrong. Please try again.'
        );
    }

    function getInputValue(id) {
        const element = $(id);

        return element
            ? element.value.trim()
            : '';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeSessionName(name) {
        return String(name || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return '—';
        }

        const date = new Date(
            String(dateValue) + 'T00:00:00'
        );

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function getInitials(name) {
        if (!name) {
            return '--';
        }

        const parts = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

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

    /* =========================================================
       PAGE MESSAGE
       ========================================================= */

    function showMessage(message, type = 'success') {
        const pageMessage = $('pageMessage');
        const messageText = $('messageText');

        if (!pageMessage || !messageText) {
            console.warn(
                '[Sessions] Page message elements not found.'
            );

            return;
        }

        messageText.textContent = message;

        pageMessage.classList.remove(
            'hidden',
            'success',
            'error',
            'warning',
            'info'
        );

        pageMessage.classList.add(type);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        console.log(
            '[Sessions] Message:',
            message
        );
    }

    function hideMessage() {
        const pageMessage = $('pageMessage');

        if (!pageMessage) {
            return;
        }

        pageMessage.classList.add('hidden');

        pageMessage.classList.remove(
            'success',
            'error',
            'warning',
            'info'
        );
    }

    /* =========================================================
       FORM ERROR
       ========================================================= */

    function showFormError(message) {
        const formError = $('formError');

        if (!formError) {
            return;
        }

        formError.textContent = message;
        formError.classList.remove('hidden');
    }

    function clearFormError() {
        const formError = $('formError');

        if (!formError) {
            return;
        }

        formError.textContent = '';
        formError.classList.add('hidden');
    }

    /* =========================================================
       LOADING
       ========================================================= */

    function setFormLoading(isLoading) {
        const saveButton = $('saveButton');
        const cancelButton = $('cancelButton');

        isCreatingSession = Boolean(isLoading);

        if (saveButton) {
            saveButton.disabled = isLoading;

            saveButton.textContent = isLoading
                ? 'Creating...'
                : 'Create Session';
        }

        if (cancelButton) {
            cancelButton.disabled = isLoading;
        }
    }

    function setPageLoading(isLoading) {
        document.body.classList.toggle(
            'page-loading',
            Boolean(isLoading)
        );
    }

    /* =========================================================
       MODAL
       ========================================================= */

    function openModal() {
        const modal = $('sessionModal');

        if (!modal) {
            console.error(
                '[Sessions] sessionModal was not found.'
            );

            return;
        }

        hideMessage();
        clearFormError();

        modal.classList.remove('hidden');
        modal.classList.add('open');

        modal.setAttribute(
            'aria-hidden',
            'false'
        );

        document.body.classList.add(
            'modal-open'
        );

        const sessionName = $('sessionName');

        if (sessionName) {
            setTimeout(function () {
                sessionName.focus();
            }, 100);
        }
    }

    function closeModal() {
        const modal = $('sessionModal');

        if (!modal) {
            return;
        }

        if (isCreatingSession) {
            return;
        }

        modal.classList.remove('open');
        modal.classList.add('hidden');

        modal.setAttribute(
            'aria-hidden',
            'true'
        );

        document.body.classList.remove(
            'modal-open'
        );

        clearFormError();
    }

    function resetForm() {
        const form = $('sessionForm');

        if (form) {
            form.reset();
        }

        clearFormError();
    }

    /* =========================================================
       USER INFORMATION
       ========================================================= */

    function populateUserDetails(session) {
        if (!session) {
            return;
        }

        const schoolName = $('schoolName');
        const userName = $('userName');
        const userRole = $('userRole');
        const userInitials = $('userInitials');

        if (schoolName) {
            schoolName.textContent =
                session.schoolName ||
                'School Results System';
        }

        if (userName) {
            userName.textContent =
                session.fullName ||
                session.name ||
                'User';
        }

        if (userRole) {
            userRole.textContent =
                session.role ||
                'Administrator';
        }

        if (userInitials) {
            userInitials.textContent =
                getInitials(
                    session.fullName ||
                    session.name ||
                    'User'
                );
        }
    }

    /* =========================================================
       ACTIVE SESSION CARD
       ========================================================= */

    function getActiveSession() {
        return sessions.find(function (session) {
            return String(
                session.status || ''
            ).toLowerCase() === 'active';
        }) || null;
    }

    function updateActiveSession() {
        const activeSessionName =
            $('activeSessionName');

        const activeSessionDates =
            $('activeSessionDates');

        const activeBadge =
            $('activeBadge');

        const activeSession =
            getActiveSession();

        if (!activeSession) {
            if (activeSessionName) {
                activeSessionName.textContent =
                    'No active session';
            }

            if (activeSessionDates) {
                activeSessionDates.textContent =
                    'Create an academic session to get started.';
            }

            if (activeBadge) {
                activeBadge.textContent =
                    'No Active Session';

                activeBadge.classList.remove(
                    'active'
                );
            }

            return;
        }

        if (activeSessionName) {
            activeSessionName.textContent =
                activeSession.sessionName ||
                'Unnamed Session';
        }

        if (activeSessionDates) {
            activeSessionDates.textContent =
                `${formatDate(activeSession.startDate)} – ${formatDate(activeSession.endDate)}`;
        }

        if (activeBadge) {
            activeBadge.textContent =
                'Active';

            activeBadge.classList.add(
                'active'
            );
        }
    }

    /* =========================================================
       SESSION TABLE
       ========================================================= */

    function renderSessionRow(session) {
        const isActive =
            String(
                session.status || ''
            ).toLowerCase() === 'active';

        /*
         * IMPORTANT:
         * Do not change the existing visual classes.
         * The existing sessions.css controls the appearance.
         *
         * The action button has a unique ID generated from
         * the session ID, so there are no duplicate IDs.
         */

        const safeSessionId =
            escapeHtml(
                session.sessionId || ''
            );

        const buttonId =
            `setActiveSession-${String(
                session.sessionId || ''
            ).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

        return `
            <tr>
                <td>
                    <div class="session-name-cell">
                        <strong>
                            ${escapeHtml(
                                session.sessionName ||
                                'Unnamed Session'
                            )}
                        </strong>

                        ${
                            isActive
                                ? `
                                    <span class="session-current-label">
                                        Current
                                    </span>
                                  `
                                : ''
                        }
                    </div>
                </td>

                <td>
                    ${escapeHtml(
                        formatDate(
                            session.startDate
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatDate(
                            session.endDate
                        )
                    )}
                </td>

                <td>
                    <span class="status-badge ${
                        isActive
                            ? 'active'
                            : 'inactive'
                    }">
                        ${
                            isActive
                                ? 'Active'
                                : 'Inactive'
                        }
                    </span>
                </td>

                <td>
                    ${
                        isActive
                            ? `
                                <span class="session-action-current">
                                    Current Session
                                </span>
                              `
                            : `
                                <button
                                    type="button"
                                    id="${buttonId}"
                                    class="table-action-button activate-session-button"
                                    data-session-id="${safeSessionId}"
                                >
                                    Set Active
                                </button>
                              `
                    }
                </td>
            </tr>
        `;
    }

    function renderEmptyState() {
        const wrapper = $('tableWrapper');

        if (!wrapper) {
            return;
        }

        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">◷</div>

                <h3>No academic sessions yet</h3>

                <p>
                    Create your first academic session
                    to start setting up your school's
                    academic year.
                </p>

                <button
                    type="button"
                    class="primary-button"
                    id="emptyCreateButton"
                >
                    + Create Session
                </button>
            </div>
        `;

        const emptyCreateButton =
            $('emptyCreateButton');

        if (emptyCreateButton) {
            emptyCreateButton.addEventListener(
                'click',
                openModal
            );
        }
    }

    function renderSessions() {
        const wrapper =
            $('tableWrapper');

        const recordCount =
            $('recordCount');

        if (!wrapper) {
            console.error(
                '[Sessions] tableWrapper was not found.'
            );

            return;
        }

        if (!Array.isArray(sessions)) {
            sessions = [];
        }

        if (recordCount) {
            recordCount.textContent =
                `${sessions.length} session${
                    sessions.length === 1
                        ? ''
                        : 's'
                }`;
        }

        updateActiveSession();

        if (sessions.length === 0) {
            renderEmptyState();
            return;
        }

        const sortedSessions =
            [...sessions].sort(
                function (a, b) {
                    const aActive =
                        String(
                            a.status || ''
                        ).toLowerCase() ===
                        'active';

                    const bActive =
                        String(
                            b.status || ''
                        ).toLowerCase() ===
                        'active';

                    if (
                        aActive &&
                        !bActive
                    ) {
                        return -1;
                    }

                    if (
                        !aActive &&
                        bActive
                    ) {
                        return 1;
                    }

                    return String(
                        b.startDate || ''
                    ).localeCompare(
                        String(
                            a.startDate || ''
                        )
                    );
                }
            );

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
                    ${sortedSessions
                        .map(renderSessionRow)
                        .join('')}
                </tbody>
            </table>
        `;

        attachSessionActions();
    }

    /* =========================================================
       LOAD SESSIONS
       ========================================================= */

    async function loadSessions(
        storedSession = null
    ) {
        const session =
            storedSession ||
            getStoredSession();

        if (
            !session ||
            !session.schoolId
        ) {
            redirectToLogin();
            return;
        }

        setPageLoading(true);

        try {
            console.log(
                '[Sessions] Loading sessions:',
                session.schoolId
            );

            const result =
                await window.schoolResultsAPI.request(
                    'getSessions',
                    {
                        schoolId:
                            session.schoolId
                    }
                );

            console.log(
                '[Sessions] getSessions response:',
                result
            );

            if (
                !result ||
                result.success === false
            ) {
                throw new Error(
                    result?.message ||
                    'Unable to load academic sessions.'
                );
            }

            if (
                Array.isArray(
                    result.sessions
                )
            ) {
                sessions =
                    result.sessions;
            } else if (
                Array.isArray(
                    result.data?.sessions
                )
            ) {
                sessions =
                    result.data.sessions;
            } else {
                sessions = [];
            }

            renderSessions();

        } catch (error) {
            console.error(
                '[Sessions] Load sessions error:',
                error
            );

            sessions = [];

            const wrapper =
                $('tableWrapper');

            if (wrapper) {
                wrapper.innerHTML = `
                    <div class="empty-state error-state">
                        <div class="empty-state-icon">!</div>

                        <h3>
                            Unable to load sessions
                        </h3>

                        <p>
                            ${escapeHtml(
                                getErrorMessage(
                                    error
                                )
                            )}
                        </p>

                        <button
                            type="button"
                            class="primary-button"
                            id="retrySessionsButton"
                        >
                            Try Again
                        </button>
                    </div>
                `;

                const retryButton =
                    $('retrySessionsButton');

                if (retryButton) {
                    retryButton.addEventListener(
                        'click',
                        function () {
                            loadSessions(
                                session
                            );
                        }
                    );
                }
            }

            showMessage(
                getErrorMessage(error),
                'error'
            );

        } finally {
            setPageLoading(false);
        }
    }

    /* =========================================================
       DUPLICATE SESSION CHECK
       ========================================================= */

    function findDuplicateSession(
        sessionName
    ) {
        const normalized =
            normalizeSessionName(
                sessionName
            );

        return sessions.find(
            function (session) {
                return (
                    normalizeSessionName(
                        session.sessionName
                    ) === normalized
                );
            }
        ) || null;
    }

    /* =========================================================
       CREATE SESSION
       ========================================================= */

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

        if (isCreatingSession) {
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

        clearFormError();
        hideMessage();

        /* -----------------------------------------
           VALIDATION
           ----------------------------------------- */

        if (!sessionName) {
            showFormError(
                'Please enter the academic session name.'
            );

            $('sessionName')?.focus();

            return;
        }

        if (!startDate) {
            showFormError(
                'Please select a start date.'
            );

            $('startDate')?.focus();

            return;
        }

        if (!endDate) {
            showFormError(
                'Please select an end date.'
            );

            $('endDate')?.focus();

            return;
        }

        if (
            new Date(startDate) >
            new Date(endDate)
        ) {
            showFormError(
                'The start date cannot be after the end date.'
            );

            $('startDate')?.focus();

            return;
        }

        /* -----------------------------------------
           DUPLICATE CHECK
           ----------------------------------------- */

        const duplicate =
            findDuplicateSession(
                sessionName
            );

        if (duplicate) {
            showFormError(
                `The academic session "${duplicate.sessionName}" already exists. Please use a different session name.`
            );

            $('sessionName')?.focus();

            return;
        }

        /* -----------------------------------------
           CREATE
           ----------------------------------------- */

        setFormLoading(true);

        try {
            console.log(
                '[Sessions] Creating new session:',
                {
                    schoolId:
                        storedSession.schoolId,
                    sessionName,
                    startDate,
                    endDate
                }
            );

            const result =
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

            console.log(
                '[Sessions] createSession response:',
                result
            );

            if (
                !result ||
                result.success === false
            ) {
                throw new Error(
                    result?.message ||
                    'The academic session could not be created.'
                );
            }

            /*
             * Backend confirmed success.
             *
             * Close the modal immediately.
             */

            isCreatingSession = false;

            const modal =
                $('sessionModal');

            if (modal) {
                modal.classList.remove(
                    'open'
                );

                modal.classList.add(
                    'hidden'
                );

                modal.setAttribute(
                    'aria-hidden',
                    'true'
                );
            }

            document.body.classList.remove(
                'modal-open'
            );

            resetForm();

            /*
             * Show success message.
             */

            showMessage(
                `Academic session "${sessionName}" was added successfully.`,
                'success'
            );

            /*
             * Reload the list immediately.
             */

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

    /* =========================================================
       ACTIVATE SESSION
       ========================================================= */

    async function activateSession(
        sessionId
    ) {
        const storedSession =
            getStoredSession();

        if (
            !storedSession ||
            !storedSession.schoolId
        ) {
            redirectToLogin();
            return;
        }

        if (
            !sessionId ||
            isActivatingSession
        ) {
            return;
        }

        const selectedSession =
            sessions.find(
                function (session) {
                    return String(
                        session.sessionId
                    ) === String(
                        sessionId
                    );
                }
            );

        if (!selectedSession) {
            showMessage(
                'The selected academic session could not be found.',
                'error'
            );

            return;
        }

        const currentActive =
            getActiveSession();

        if (
            currentActive &&
            String(
                currentActive.sessionId
            ) === String(sessionId)
        ) {
            showMessage(
                `"${selectedSession.sessionName}" is already the active academic session.`,
                'info'
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Set "${selectedSession.sessionName}" as the active academic session?`
            );

        if (!confirmed) {
            return;
        }

        isActivatingSession = true;

        try {
            /*
             * Disable the action area while the
             * backend changes the active session.
             */

            const clickedButton =
                document.querySelector(
                    `[data-session-id="${CSS.escape(
                        String(sessionId)
                    )}"]`
                );

            if (clickedButton) {
                clickedButton.disabled =
                    true;

                clickedButton.textContent =
                    'Setting Active...';
            }

            console.log(
                '[Sessions] Setting active session:',
                sessionId
            );

            const result =
                await window.schoolResultsAPI.request(
                    'setActiveSession',
                    {
                        schoolId:
                            storedSession.schoolId,

                        sessionId:
                            sessionId
                    }
                );

            console.log(
                '[Sessions] setActiveSession response:',
                result
            );

            if (
                !result ||
                result.success === false
            ) {
                throw new Error(
                    result?.message ||
                    'The academic session could not be made active.'
                );
            }

            /*
             * Update the local list immediately.
             *
             * The old active session becomes inactive.
             * The selected session becomes active.
             */

            sessions =
                sessions.map(
                    function (session) {
                        return {
                            ...session,
                            status:
                                String(
                                    session.sessionId
                                ) === String(
                                    sessionId
                                )
                                    ? 'Active'
                                    : 'Inactive'
                        };
                    }
                );

            /*
             * Redraw immediately.
             */

            renderSessions();

            /*
             * Tell the user exactly what happened.
             */

            showMessage(
                `"${selectedSession.sessionName}" has been made the active academic session.`,
                'success'
            );

            /*
             * Reload from the backend afterward so
             * the screen and database stay synchronized.
             */

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

            /*
             * Restore the real server state if
             * activation failed.
             */

            await loadSessions(
                storedSession
            );

        } finally {
            isActivatingSession = false;
        }
    }

    /* =========================================================
       SESSION ACTION BUTTONS
       ========================================================= */

    function attachSessionActions() {
        const buttons =
            document.querySelectorAll(
                '.activate-session-button'
            );

        buttons.forEach(
            function (button) {
                button.addEventListener(
                    'click',
                    function () {
                        const sessionId =
                            this.getAttribute(
                                'data-session-id'
                            );

                        activateSession(
                            sessionId
                        );
                    }
                );
            }
        );
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function setupNavigation() {
        const menuButton =
            $('menuButton');

        const sidebar =
            $('sidebar');

        const sidebarOverlay =
            $('sidebarOverlay');

        if (
            menuButton &&
            sidebar
        ) {
            menuButton.addEventListener(
                'click',
                function () {
                    sidebar.classList.toggle(
                        'open'
                    );

                    if (
                        sidebarOverlay
                    ) {
                        sidebarOverlay.classList.toggle(
                            'open'
                        );
                    }
                }
            );
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener(
                'click',
                function () {
                    sidebar?.classList.remove(
                        'open'
                    );

                    sidebarOverlay.classList.remove(
                        'open'
                    );
                }
            );
        }

        const logoutButton =
            $('logoutButton');

        if (logoutButton) {
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
                        LOGIN_PAGE;
                }
            );
        }
    }

    /* =========================================================
       EVENT LISTENERS
       ========================================================= */

    function setupEventListeners() {
        const openCreateButton =
            $('openCreateButton');

        if (openCreateButton) {
            openCreateButton.addEventListener(
                'click',
                openModal
            );
        }

        const closeModalButton =
            $('closeModalButton');

        if (closeModalButton) {
            closeModalButton.addEventListener(
                'click',
                closeModal
            );
        }

        const cancelButton =
            $('cancelButton');

        if (cancelButton) {
            cancelButton.addEventListener(
                'click',
                closeModal
            );
        }

        const closeMessage =
            $('closeMessage');

        if (closeMessage) {
            closeMessage.addEventListener(
                'click',
                hideMessage
            );
        }

        const sessionForm =
            $('sessionForm');

        if (sessionForm) {
            sessionForm.addEventListener(
                'submit',
                function (event) {
                    event.preventDefault();

                    console.log(
                        '[Sessions] Session form submitted.'
                    );

                    createSession();
                }
            );
        }

        const modal =
            $('sessionModal');

        if (modal) {
            modal.addEventListener(
                'click',
                function (event) {
                    if (
                        event.target === modal &&
                        !isCreatingSession
                    ) {
                        closeModal();
                    }
                }
            );
        }

        document.addEventListener(
            'keydown',
            function (event) {
                if (
                    event.key === 'Escape' &&
                    !isCreatingSession
                ) {
                    closeModal();
                }
            }
        );
    }

    /* =========================================================
       INITIALIZE
       ========================================================= */

    async function initialize() {
        console.log(
            '[Sessions] Initializing Sessions page...'
        );

        const storedSession =
            getStoredSession();

        if (
            !storedSession ||
            !storedSession.schoolId
        ) {
            console.warn(
                '[Sessions] No valid login session found.'
            );

            redirectToLogin();
            return;
        }

        if (
            !window.schoolResultsAPI ||
            typeof window.schoolResultsAPI.request !==
                'function'
        ) {
            console.error(
                '[Sessions] Central API client is unavailable.'
            );

            showMessage(
                'The API client could not be loaded. Please refresh the page.',
                'error'
            );

            return;
        }

        populateUserDetails(
            storedSession
        );

        setupNavigation();
        setupEventListeners();

        await loadSessions(
            storedSession
        );

        console.log(
            '[Sessions] Sessions page initialized.'
        );
    }

    /* =========================================================
       GLOBAL API
       ========================================================= */

    window.schoolResultsSessions = {
        loadSessions,
        createSession,
        activateSession,
        openModal,
        closeModal
    };

    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );
    } else {
        initialize();
    }

})();
