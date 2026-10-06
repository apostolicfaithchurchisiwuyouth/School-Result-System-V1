/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: /js/dashboard.js
 * VERSION: 2.1.0
 *
 * PURPOSE:
 * Dashboard frontend controller.
 *
 * API ARCHITECTURE:
 *
 * Browser
 *    ↓
 * /js/api.js
 *    ↓
 * /api/school-results
 *    ↓
 * Vercel API Proxy
 *    ↓
 * Google Apps Script
 *    ↓
 * Google Sheets
 *
 * IMPORTANT:
 * This file MUST NOT communicate directly with
 * Google Apps Script.
 * ============================================================
 */

(function () {
    'use strict';


    // ========================================================
    // CONFIGURATION
    // ========================================================

    const SESSION_KEY =
        'school_results_system_session_v1';

    const LOGIN_URL =
        '/index.html';


    // ========================================================
    // DOM ELEMENTS
    // ========================================================

    const pageLoading =
        document.getElementById(
            'pageLoading'
        );

    const dashboardContent =
        document.getElementById(
            'dashboardContent'
        );

    const dashboardError =
        document.getElementById(
            'dashboardError'
        );

    const dashboardErrorMessage =
        document.getElementById(
            'dashboardErrorMessage'
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


    // ========================================================
    // START
    // ========================================================

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeDashboard
        );

    } else {

        initializeDashboard();

    }


    // ========================================================
    // INITIALIZE DASHBOARD
    // ========================================================

    function initializeDashboard() {

        setupNavigation();

        setupLogout();

        setupRetry();


        const session =
            getStoredSession();


        // ----------------------------------------------------
        // NO SESSION
        // ----------------------------------------------------

        if (
            !session ||
            !session.schoolId
        ) {

            redirectToLogin();

            return;

        }


        // ----------------------------------------------------
        // SHOW USER INFORMATION
        // ----------------------------------------------------

        populateUserHeader(
            session
        );


        // ----------------------------------------------------
        // LOAD DASHBOARD
        // ----------------------------------------------------

        loadDashboard();

    }


    // ========================================================
    // GET STORED SESSION
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


    // ========================================================
    // REDIRECT TO LOGIN
    // ========================================================

    function redirectToLogin() {

        window.location.replace(
            LOGIN_URL
        );

    }


    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    async function loadDashboard() {

        showLoading();


        try {

            const session =
                getStoredSession();


            // ------------------------------------------------
            // SESSION CHECK
            // ------------------------------------------------

            if (
                !session ||
                !session.schoolId
            ) {

                redirectToLogin();

                return;

            }


            // ------------------------------------------------
            // CENTRAL API REQUEST
            // ------------------------------------------------
            //
            // IMPORTANT:
            // There is NO direct Apps Script fetch here.
            //
            // dashboard.js
            //      ↓
            // api.js
            //      ↓
            // /api/school-results
            //      ↓
            // Apps Script
            //
            // ------------------------------------------------

            const result =
                await window.schoolResultsAPI.request(
                    'getDashboardData',
                    {
                        schoolId:
                            session.schoolId
                    }
                );


            // ------------------------------------------------
            // EXTRACT RESPONSE
            // ------------------------------------------------

            const data =
                extractDashboardData(
                    result
                );


            if (!data) {

                throw new Error(
                    'No dashboard data was returned.'
                );

            }


            // ------------------------------------------------
            // POPULATE
            // ------------------------------------------------

            populateDashboard(
                data
            );


            showDashboard();


        } catch (error) {

            console.error(
                'Dashboard loading error:',
                error
            );


            showDashboardError(
                getErrorMessage(error)
            );

        }

    }


    // ========================================================
    // EXTRACT DASHBOARD DATA
    // ========================================================

    function extractDashboardData(
        result
    ) {

        if (!result) {

            return null;

        }


        // ----------------------------------------------------
        // Direct response
        // ----------------------------------------------------

        if (
            result.success &&
            result.school
        ) {

            return result;

        }


        // ----------------------------------------------------
        // Wrapped in data
        // ----------------------------------------------------

        if (
            result.data &&
            result.data.school
        ) {

            return result.data;

        }


        // ----------------------------------------------------
        // Some backend responses may return:
        //
        // {
        //     success: true,
        //     data: {
        //         ...
        //     }
        // }
        // ----------------------------------------------------

        if (
            result.data &&
            typeof result.data === 'object'
        ) {

            return result.data;

        }


        return null;

    }


    // ========================================================
    // POPULATE USER HEADER
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


        const welcomeName =
            document.getElementById(
                'welcomeName'
            );


        const topbarUserName =
            document.getElementById(
                'topbarUserName'
            );


        const topbarUserRole =
            document.getElementById(
                'topbarUserRole'
            );


        const userInitials =
            document.getElementById(
                'userInitials'
            );


        if (welcomeName) {

            welcomeName.textContent =
                getFirstName(
                    fullName
                );

        }


        if (topbarUserName) {

            topbarUserName.textContent =
                fullName;

        }


        if (topbarUserRole) {

            topbarUserRole.textContent =
                role;

        }


        if (userInitials) {

            userInitials.textContent =
                getInitials(
                    fullName
                );

        }

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


        // ----------------------------------------------------
        // SCHOOL INFORMATION
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // COUNTS
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // ACTIVE SESSION
        // ----------------------------------------------------

        populateActiveSession(
            data.activeSession
        );


        // ----------------------------------------------------
        // RECENT SESSIONS
        // ----------------------------------------------------

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


        if (!nameElement ||
            !datesElement) {

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
            !Array.isArray(
                sessions
            ) ||
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
                .map(
                    function (session) {

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


                        let dateText =
                            '';


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

                    }
                )
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


        const navLinks =
            document.querySelectorAll(
                '.nav-link'
            );


        navLinks.forEach(
            function (link) {

                link.addEventListener(
                    'click',
                    closeMobileSidebar
                );

            }
        );

    }


    // ========================================================
    // CLOSE MOBILE SIDEBAR
    // ========================================================

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
    // LOADING STATE
    // ========================================================

    function showLoading() {

        if (pageLoading) {

            pageLoading.classList.remove(
                'hidden'
            );

        }


        if (dashboardContent) {

            dashboardContent.classList.add(
                'hidden'
            );

        }


        if (dashboardError) {

            dashboardError.classList.add(
                'hidden'
            );

        }

    }


    // ========================================================
    // SHOW DASHBOARD
    // ========================================================

    function showDashboard() {

        if (pageLoading) {

            pageLoading.classList.add(
                'hidden'
            );

        }


        if (dashboardError) {

            dashboardError.classList.add(
                'hidden'
            );

        }


        if (dashboardContent) {

            dashboardContent.classList.remove(
                'hidden'
            );

        }

    }


    // ========================================================
    // SHOW ERROR
    // ========================================================

    function showDashboardError(
        message
    ) {

        if (pageLoading) {

            pageLoading.classList.add(
                'hidden'
            );

        }


        if (dashboardContent) {

            dashboardContent.classList.add(
                'hidden'
            );

        }


        if (dashboardErrorMessage) {

            dashboardErrorMessage.textContent =
                message ||
                'Unable to load dashboard.';

        }


        if (dashboardError) {

            dashboardError.classList.remove(
                'hidden'
            );

        }

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


    // ========================================================
    // SET TEXT
    // ========================================================

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
                : String(value);

    }


    // ========================================================
    // GET FIRST NAME
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
    // GET INITIALS
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
    // FORMAT PLAN
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
    // FORMAT DATE
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

})();
