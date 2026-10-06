/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: dashboard.js
 * VERSION: 2.2.0
 *
 * PURPOSE:
 * Dashboard frontend controller.
 *
 * API:
 * All server communication goes through api.js.
 * ============================================================
 */

(function () {
    'use strict';

    const SESSION_KEY =
        'school_results_system_session_v1';

    const LOGIN_URL =
        '/index.html';

    const pageLoading =
        document.getElementById('pageLoading');

    const dashboardContent =
        document.getElementById('dashboardContent');

    const dashboardError =
        document.getElementById('dashboardError');

    const dashboardErrorMessage =
        document.getElementById(
            'dashboardErrorMessage'
        );

    const retryButton =
        document.getElementById('retryButton');

    const menuButton =
        document.getElementById('menuButton');

    const sidebar =
        document.getElementById('sidebar');

    const sidebarOverlay =
        document.getElementById(
            'sidebarOverlay'
        );

    const sidebarLogoutButton =
        document.getElementById(
            'sidebarLogoutButton'
        );


    // ========================================================
    // START
    // ========================================================

    function start() {

        try {

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

            loadDashboard();

        } catch (error) {

            console.error(
                'Dashboard initialization error:',
                error
            );

            showDashboardError(
                getErrorMessage(error)
            );
        }
    }


    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            start
        );

    } else {

        start();

    }


    // ========================================================
    // SESSION
    // ========================================================

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

                localStorage.removeItem(
                    SESSION_KEY
                );

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
            LOGIN_URL
        );
    }


    // ========================================================
    // DASHBOARD API
    // ========================================================

    async function loadDashboard() {

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


            /*
             * Make absolutely sure api.js loaded.
             */
            if (
                !window.schoolResultsAPI ||
                typeof
                    window.schoolResultsAPI.request !==
                    'function'
            ) {

                throw new Error(
                    'The central API client could not be loaded. Please refresh the page.'
                );
            }


            console.log(
                '[Dashboard] Requesting dashboard data...'
            );


            const result =
                await window.schoolResultsAPI.request(
                    'getDashboardData',
                    {
                        schoolId:
                            session.schoolId
                    }
                );


            console.log(
                '[Dashboard] Dashboard data received:',
                result
            );


            const data =
                extractDashboardData(
                    result
                );


            if (!data) {

                throw new Error(
                    'The server did not return valid dashboard data.'
                );
            }


            populateDashboard(
                data
            );


            showDashboard();

        } catch (error) {

            console.error(
                '[Dashboard] Loading failed:',
                error
            );

            showDashboardError(
                getErrorMessage(error)
            );
        }
    }


    // ========================================================
    // EXTRACT DATA
    // ========================================================

    function extractDashboardData(
        result
    ) {

        if (!result) {
            return null;
        }


        if (
            result.school
        ) {

            return result;
        }


        if (
            result.data &&
            result.data.school
        ) {

            return result.data;
        }


        return null;
    }


    // ========================================================
    // USER HEADER
    // ========================================================

    function populateUserHeader(
        session
    ) {

        const fullName =
            session.fullName ||
            'User';

        const role =
            session.role ||
            'User';


        setText(
            'welcomeName',
            getFirstName(fullName)
        );


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
            getInitials(fullName)
        );
    }


    // ========================================================
    // POPULATE DASHBOARD
    // ========================================================

    function populateDashboard(
        data
    ) {

        const school =
            data.school || {};

        const counts =
            data.counts || {};


        setText(
            'topbarSchoolName',
            school.schoolName ||
                'School Results System'
        );


        setText(
            'schoolStatus',
            school.status ||
                'Active'
        );


        setText(
            'schoolPlan',
            formatPlan(
                school.plan
            )
        );


        setText(
            'detailSchoolName',
            school.schoolName ||
                '—'
        );


        setText(
            'detailSchoolCode',
            school.schoolCode ||
                '—'
        );


        setText(
            'detailSchoolEmail',
            school.email ||
                '—'
        );


        setText(
            'detailSchoolPhone',
            school.phone ||
                '—'
        );


        setText(
            'detailSchoolPlan',
            formatPlan(
                school.plan
            )
        );


        setText(
            'classesCount',
            counts.classes || 0
        );


        setText(
            'studentsCount',
            counts.students || 0
        );


        setText(
            'teachersCount',
            counts.teachers || 0
        );


        setText(
            'subjectsCount',
            counts.subjects || 0
        );


        setText(
            'assignmentsCount',
            counts.assignments || 0
        );


        populateActiveSession(
            data.activeSession
        );


        populateRecentSessions(
            data.recentSessions || []
        );
    }


    // ========================================================
    // ACTIVE SESSION
    // ========================================================

    function populateActiveSession(
        session
    ) {

        const nameElement =
            document.getElementById(
                'activeSessionName'
            );

        const datesElement =
            document.getElementById(
                'activeSessionDates'
            );


        if (
            !nameElement ||
            !datesElement
        ) {
            return;
        }


        if (!session) {

            nameElement.textContent =
                'No active session';

            datesElement.textContent =
                'Create an academic session to get started.';

            return;
        }


        nameElement.textContent =
            session.sessionName ||
            'Active Session';


        const start =
            formatDate(
                session.startDate
            );

        const end =
            formatDate(
                session.endDate
            );


        if (
            start &&
            end
        ) {

            datesElement.textContent =
                `${start} — ${end}`;

        } else if (start) {

            datesElement.textContent =
                `Starts ${start}`;

        } else {

            datesElement.textContent =
                'Active academic session';
        }
    }


    // ========================================================
    // RECENT SESSIONS
    // ========================================================

    function populateRecentSessions(
        sessions
    ) {

        const container =
            document.getElementById(
                'sessionsList'
            );


        if (!container) {
            return;
        }


        if (
            !Array.isArray(sessions) ||
            sessions.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    <strong>
                        No sessions yet
                    </strong>

                    <span>
                        Create your first
                        academic session.
                    </span>
                </div>
            `;

            return;
        }


        container.innerHTML =
            sessions
                .map(function (session) {

                    const status =
                        String(
                            session.status ||
                            ''
                        ).trim();


                    const statusClass =
                        status.toLowerCase() ===
                        'active'
                            ? 'active'
                            : '';


                    const start =
                        formatDate(
                            session.startDate
                        );


                    const end =
                        formatDate(
                            session.endDate
                        );


                    let dateText = '';


                    if (
                        start &&
                        end
                    ) {

                        dateText =
                            `${start} — ${end}`;

                    } else if (start) {

                        dateText =
                            start;
                    }


                    return `
                        <div class="session-row">

                            <div class="session-row-info">

                                <strong>
                                    ${escapeHtml(
                                        session.sessionName ||
                                        'Unnamed Session'
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        dateText ||
                                        'No dates specified'
                                    )}
                                </span>

                            </div>

                            <span
                                class="session-row-status ${statusClass}"
                            >
                                ${escapeHtml(
                                    status ||
                                    'Unknown'
                                )}
                            </span>

                        </div>
                    `;
                })
                .join('');
    }


    // ========================================================
    // NAVIGATION
    // ========================================================

    function setupNavigation() {

        if (menuButton) {

            menuButton.addEventListener(
                'click',
                function () {

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
            .querySelectorAll('.nav-link')
            .forEach(function (link) {

                link.addEventListener(
                    'click',
                    closeMobileSidebar
                );
            });
    }


    function closeMobileSidebar() {

        sidebar?.classList.remove(
            'open'
        );

        sidebarOverlay?.classList.remove(
            'visible'
        );
    }


    // ========================================================
    // LOGOUT
    // ========================================================

    function setupLogout() {

        if (!sidebarLogoutButton) {
            return;
        }


        sidebarLogoutButton.addEventListener(
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


    // ========================================================
    // RETRY
    // ========================================================

    function setupRetry() {

        if (!retryButton) {
            return;
        }


        retryButton.addEventListener(
            'click',
            function () {

                loadDashboard();
            }
        );
    }


    // ========================================================
    // LOADING
    // ========================================================

    function showLoading() {

        pageLoading?.classList.remove(
            'hidden'
        );

        dashboardContent?.classList.add(
            'hidden'
        );

        dashboardError?.classList.add(
            'hidden'
        );
    }


    // ========================================================
    // SHOW DASHBOARD
    // ========================================================

    function showDashboard() {

        pageLoading?.classList.add(
            'hidden'
        );

        dashboardError?.classList.add(
            'hidden'
        );

        dashboardContent?.classList.remove(
            'hidden'
        );
    }


    // ========================================================
    // SHOW ERROR
    // ========================================================

    function showDashboardError(
        message
    ) {

        pageLoading?.classList.add(
            'hidden'
        );

        dashboardContent?.classList.add(
            'hidden'
        );


        if (dashboardErrorMessage) {

            dashboardErrorMessage.textContent =
                message ||
                'Unable to load dashboard.';
        }


        dashboardError?.classList.remove(
            'hidden'
        );
    }


    // ========================================================
    // SET TEXT
    // ========================================================

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        element.textContent =
            value === null ||
            value === undefined ||
            value === ''
                ? '—'
                : String(value);
    }


    // ========================================================
    // FIRST NAME
    // ========================================================

    function getFirstName(
        fullName
    ) {

        const value =
            String(
                fullName || ''
            ).trim();


        if (!value) {
            return 'Administrator';
        }


        return value.split(/\s+/)[0];
    }


    // ========================================================
    // INITIALS
    // ========================================================

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


    // ========================================================
    // PLAN
    // ========================================================

    function formatPlan(
        plan
    ) {

        const value =
            String(
                plan || ''
            ).trim();


        if (!value) {
            return 'No plan';
        }


        return `${value} Plan`;
    }


    // ========================================================
    // DATE
    // ========================================================

    function formatDate(
        value
    ) {

        if (!value) {
            return '';
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
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


    // ========================================================
    // ESCAPE HTML
    // ========================================================

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


    // ========================================================
    // ERROR MESSAGE
    // ========================================================

    function getErrorMessage(
        error
    ) {

        if (
            error &&
            typeof error.message ===
                'string' &&
            error.message.trim()
        ) {

            return error.message;
        }


        return (
            'Unable to load the dashboard. Please try again.'
        );
    }

})();
