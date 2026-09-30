/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: dashboard.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Dashboard frontend.
 * ============================================================
 */


// ============================================================
// CONFIGURATION
// ============================================================

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';

const SESSION_KEY =
    'school_results_system_session_v1';


// ============================================================
// DOM ELEMENTS
// ============================================================

const pageLoading =
    document.getElementById('pageLoading');

const dashboardContent =
    document.getElementById('dashboardContent');

const dashboardError =
    document.getElementById('dashboardError');

const dashboardErrorMessage =
    document.getElementById('dashboardErrorMessage');

const retryButton =
    document.getElementById('retryButton');

const menuButton =
    document.getElementById('menuButton');

const sidebar =
    document.getElementById('sidebar');

const sidebarOverlay =
    document.getElementById('sidebarOverlay');

const sidebarLogoutButton =
    document.getElementById(
        'sidebarLogoutButton'
    );


// ============================================================
// START
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    function() {

        initializeDashboard();

    }
);


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

function initializeDashboard() {

    setupNavigation();

    setupLogout();

    setupRetry();

    const session =
        getStoredSession();


    // --------------------------------------------------------
    // NO SESSION
    // --------------------------------------------------------

    if (!session || !session.schoolId) {

        redirectToLogin();

        return;

    }


    // --------------------------------------------------------
    // SHOW USER INFORMATION
    // --------------------------------------------------------

    populateUserHeader(session);


    // --------------------------------------------------------
    // LOAD DASHBOARD
    // --------------------------------------------------------

    loadDashboard();

}


// ============================================================
// GET STORED SESSION
// ============================================================

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

        return null;

    }

}


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToLogin() {

    window.location.href =
        'index.html';

}


// ============================================================
// API REQUEST
// ============================================================

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
                    JSON.stringify(payload)

            }
        );


    if (!response.ok) {

        throw new Error(
            'Server request failed.'
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
            'The request could not be completed.'
        );

    }


    return result;

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

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


        const result =
            await apiRequest(
                'getDashboardData',
                {
                    schoolId:
                        session.schoolId
                }
            );


        const data =
            extractDashboardData(
                result
            );


        if (!data) {

            throw new Error(
                'No dashboard data was returned.'
            );

        }


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
            error.message ||
            'Unable to load dashboard.'
        );

    }

}


// ============================================================
// EXTRACT DASHBOARD DATA
// ============================================================

function extractDashboardData(
    result
) {

    if (!result) {
        return null;
    }


    if (
        result.success &&
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


// ============================================================
// POPULATE USER HEADER
// ============================================================

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
            getFirstName(fullName);

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
            getInitials(fullName);

    }

}


// ============================================================
// POPULATE DASHBOARD
// ============================================================

function populateDashboard(
    data
) {

    const school =
        data.school || {};

    const counts =
        data.counts || {};


    // --------------------------------------------------------
    // SCHOOL
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // COUNTS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ACTIVE SESSION
    // --------------------------------------------------------

    populateActiveSession(
        data.activeSession
    );


    // --------------------------------------------------------
    // RECENT SESSIONS
    // --------------------------------------------------------

    populateRecentSessions(
        data.recentSessions || []
    );

}


// ============================================================
// ACTIVE SESSION
// ============================================================

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


    if (start && end) {

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


// ============================================================
// RECENT SESSIONS
// ============================================================

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
        sessions.map(
            function(session) {

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


                if (start && end) {

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
        ).join('');

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    if (menuButton) {

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
        function(link) {

            link.addEventListener(
                'click',
                function() {

                    closeMobileSidebar();

                }
            );

        }
    );

}


// ============================================================
// CLOSE MOBILE SIDEBAR
// ============================================================

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


// ============================================================
// LOGOUT
// ============================================================

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
                'index.html';

        }
    );

}


// ============================================================
// RETRY
// ============================================================

function setupRetry() {

    if (!retryButton) {
        return;
    }


    retryButton.addEventListener(
        'click',
        function() {

            loadDashboard();

        }
    );

}


// ============================================================
// LOADING STATE
// ============================================================

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


// ============================================================
// SHOW DASHBOARD
// ============================================================

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


// ============================================================
// SHOW ERROR
// ============================================================

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


// ============================================================
// SET TEXT
// ============================================================

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


// ============================================================
// GET FIRST NAME
// ============================================================

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


// ============================================================
// GET INITIALS
// ============================================================

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


// ============================================================
// FORMAT PLAN
// ============================================================

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


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return '';
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {

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


// ============================================================
// ESCAPE HTML
// ============================================================

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
