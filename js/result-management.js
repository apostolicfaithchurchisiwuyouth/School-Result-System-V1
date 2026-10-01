/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: result-management.js
   VERSION: 1.0.0

   RESULT MANAGEMENT FRONTEND
============================================================ */


/* ============================================================
   CONFIG
============================================================ */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';

const SESSION_KEY =
    'school_results_system_session_v1';


/* ============================================================
   STATE
============================================================ */

let currentSession = null;

let setupData = {
    sessions: [],
    classes: [],
    terms: []
};

let currentOverview = null;

let currentStudents = [];

let currentSelected = {
    sessionId: '',
    term: '',
    classId: ''
};


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        initializePage();

    }
);


/* ============================================================
   INITIALIZE
============================================================ */

function initializePage() {

    currentSession =
        loadStoredSession();


    if (!currentSession) {

        redirectToLogin();

        return;

    }


    applySessionToHeader();

    bindEvents();

    loadSetup();

}


/* ============================================================
   SESSION
============================================================ */

function loadStoredSession() {

    try {

        const raw =
            localStorage.getItem(
                SESSION_KEY
            );


        if (!raw) {

            return null;

        }


        const parsed =
            JSON.parse(raw);


        if (!parsed) {

            return null;

        }


        /*
         * The login response is normally stored
         * as one session object.
         *
         * This normalization supports both:
         *
         * {
         *   user: {...},
         *   school: {...}
         * }
         *
         * and older flattened structures.
         */

        const user =
            parsed.user ||
            parsed.User ||
            parsed;


        const school =
            parsed.school ||
            parsed.School ||
            {};


        const schoolId =
            parsed.schoolId ||
            user.schoolId ||
            school.schoolId ||
            school['School ID'] ||
            '';


        const userName =
            parsed.fullName ||
            user.fullName ||
            user.name ||
            school.fullName ||
            'User';


        const role =
            parsed.role ||
            user.role ||
            'User';


        const schoolName =
            parsed.schoolName ||
            school.schoolName ||
            school['School Name'] ||
            'School Results System';


        if (!schoolId) {

            return null;

        }


        return {

            schoolId:
                String(schoolId).trim(),

            userId:
                String(
                    parsed.userId ||
                    user.userId ||
                    ''
                ).trim(),

            fullName:
                String(userName).trim(),

            role:
                String(role).trim(),

            schoolName:
                String(schoolName).trim()

        };

    } catch (error) {

        console.error(
            'Could not load saved session:',
            error
        );

        return null;

    }

}


/* ============================================================
   HEADER
============================================================ */

function applySessionToHeader() {

    if (!currentSession) {
        return;
    }


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


    const initials =
        document.getElementById(
            'userInitials'
        );


    if (schoolName) {

        schoolName.textContent =
            currentSession.schoolName ||
            'School Results System';

    }


    if (userName) {

        userName.textContent =
            currentSession.fullName ||
            'User';

    }


    if (userRole) {

        userRole.textContent =
            currentSession.role ||
            'User';

    }


    if (initials) {

        initials.textContent =
            getInitials(
                currentSession.fullName
            );

    }

}


/* ============================================================
   INITIALS
============================================================ */

function getInitials(name) {

    if (!name) {

        return 'SR';

    }


    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {

        return 'SR';

    }


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


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    const sessionSelect =
        document.getElementById(
            'sessionSelect'
        );


    const termSelect =
        document.getElementById(
            'termSelect'
        );


    const classSelect =
        document.getElementById(
            'classSelect'
        );


    const menuButton =
        document.getElementById(
            'menuButton'
        );


    const logoutButton =
        document.getElementById(
            'logoutButton'
        );


    const closeMessage =
        document.getElementById(
            'closeMessage'
        );


    const closeStudentResultButton =
        document.getElementById(
            'closeStudentResultButton'
        );


    const cancelResultButton =
        document.getElementById(
            'cancelResultButton'
        );


    if (sessionSelect) {

        sessionSelect.addEventListener(
            'change',
            handleSelectionChange
        );

    }


    if (termSelect) {

        termSelect.addEventListener(
            'change',
            handleSelectionChange
        );

    }


    if (classSelect) {

        classSelect.addEventListener(
            'change',
            handleSelectionChange
        );

    }


    if (menuButton) {

        menuButton.addEventListener(
            'click',
            toggleSidebar
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            logout
        );

    }


    if (closeMessage) {

        closeMessage.addEventListener(
            'click',
            hideMessage
        );

    }


    if (closeStudentResultButton) {

        closeStudentResultButton.addEventListener(
            'click',
            closeStudentResultModal
        );

    }


    if (cancelResultButton) {

        cancelResultButton.addEventListener(
            'click',
            closeStudentResultModal
        );

    }


    const modal =
        document.getElementById(
            'studentResultModal'
        );


    if (modal) {

        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeStudentResultModal();

                }

            }
        );

    }


    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape'
            ) {

                closeStudentResultModal();

                closeSidebar();

            }

        }
    );

}


/* ============================================================
   SIDEBAR
============================================================ */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            'sidebar'
        );


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        'open'
    );

}


function closeSidebar() {

    const sidebar =
        document.getElementById(
            'sidebar'
        );


    if (!sidebar) {
        return;
    }


    sidebar.classList.remove(
        'open'
    );

}


/* ============================================================
   LOAD SETUP
============================================================ */

async function loadSetup() {

    showSelectionLoading();

    hidePageMessage();


    try {

        const result =
            await apiRequest(
                'getResultManagementSetup',
                {
                    schoolId:
                        currentSession.schoolId
                }
            );


        if (!result.success) {

            throw new Error(
                result.error ||
                result.message ||
                'Could not load result management setup.'
            );

        }


        setupData = {

            sessions:
                Array.isArray(
                    result.sessions
                )
                    ? result.sessions
                    : [],

            classes:
                Array.isArray(
                    result.classes
                )
                    ? result.classes
                    : [],

            terms:
                Array.isArray(
                    result.terms
                )
                    ? result.terms
                    : []

        };


        populateSessions();

        populateTerms();

        populateClasses();


        chooseDefaultSelection();


    } catch (error) {

        console.error(
            'Result management setup error:',
            error
        );


        showMessage(
            error.message ||
            'Could not load result management setup.'
        );

    }

}


/* ============================================================
   POPULATE SESSION
============================================================ */

function populateSessions() {

    const select =
        document.getElementById(
            'sessionSelect'
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Select session</option>';


    setupData.sessions.forEach(
        function (session) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                session.sessionId || '';


            option.textContent =
                session.sessionName ||
                session.sessionId ||
                'Unnamed Session';


            select.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   POPULATE TERM
============================================================ */

function populateTerms() {

    const select =
        document.getElementById(
            'termSelect'
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Select term</option>';


    setupData.terms.forEach(
        function (term) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                term;


            option.textContent =
                term;


            select.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   POPULATE CLASS
============================================================ */

function populateClasses() {

    const select =
        document.getElementById(
            'classSelect'
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Select class</option>';


    setupData.classes.forEach(
        function (classRecord) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                classRecord.classId || '';


            option.textContent =
                buildClassName(
                    classRecord
                );


            select.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   CLASS LABEL
============================================================ */

function buildClassName(classRecord) {

    const className =
        classRecord.className ||
        'Unnamed Class';


    const section =
        classRecord.section ||
        '';


    if (!section) {

        return className;

    }


    return (
        className +
        ' — ' +
        section
    );

}


/* ============================================================
   DEFAULT SELECTION
============================================================ */

function chooseDefaultSelection() {

    const sessionSelect =
        document.getElementById(
            'sessionSelect'
        );


    const termSelect =
        document.getElementById(
            'termSelect'
        );


    const classSelect =
        document.getElementById(
            'classSelect'
        );


    /*
     * Prefer active session.
     */

    let selectedSession =
        setupData.sessions.find(
            function (session) {

                return normalize(
                    session.status
                ) === 'active';

            }
        );


    /*
     * Otherwise use first session.
     */

    if (!selectedSession) {

        selectedSession =
            setupData.sessions[0];

    }


    if (
        selectedSession &&
        sessionSelect
    ) {

        sessionSelect.value =
            selectedSession.sessionId ||
            '';

    }


    /*
     * Prefer First Term.
     */

    let selectedTerm =
        setupData.terms.find(
            function (term) {

                return normalize(term) ===
                    'first term';

            }
        );


    if (!selectedTerm) {

        selectedTerm =
            setupData.terms[0];

    }


    if (
        selectedTerm &&
        termSelect
    ) {

        termSelect.value =
            selectedTerm;

    }


    /*
     * Use first active class.
     */

    let selectedClass =
        setupData.classes.find(
            function (classRecord) {

                return normalize(
                    classRecord.status
                ) === 'active';

            }
        );


    if (!selectedClass) {

        selectedClass =
            setupData.classes[0];

    }


    if (
        selectedClass &&
        classSelect
    ) {

        classSelect.value =
            selectedClass.classId ||
            '';

    }


    currentSelected = {

        sessionId:
            sessionSelect
                ? sessionSelect.value
                : '',

        term:
            termSelect
                ? termSelect.value
                : '',

        classId:
            classSelect
                ? classSelect.value
                : ''

    };


    if (
        currentSelected.sessionId &&
        currentSelected.term &&
        currentSelected.classId
    ) {

        loadResultManagement();

    } else {

        showSelectionMessage(
            'Select a session, term and class to view results.'
        );

    }

}


/* ============================================================
   SELECTION CHANGE
============================================================ */

function handleSelectionChange() {

    const sessionSelect =
        document.getElementById(
            'sessionSelect'
        );


    const termSelect =
        document.getElementById(
            'termSelect'
        );


    const classSelect =
        document.getElementById(
            'classSelect'
        );


    currentSelected = {

        sessionId:
            sessionSelect
                ? sessionSelect.value
                : '',

        term:
            termSelect
                ? termSelect.value
                : '',

        classId:
            classSelect
                ? classSelect.value
                : ''

    };


    hidePageMessage();

    hideResultSections();


    if (
        !currentSelected.sessionId ||
        !currentSelected.term ||
        !currentSelected.classId
    ) {

        showSelectionMessage(
            'Select a session, term and class to view results.'
        );

        return;

    }


    hideSelectionMessage();

    loadResultManagement();

}


/* ============================================================
   LOAD RESULTS
============================================================ */

async function loadResultManagement() {

    showSelectionLoading();

    hidePageMessage();


    setOverviewLoading();

    setTableLoading();


    try {

        /*
         * Load overview and student list.
         *
         * These calls use the exact parameters
         * required by ResultManagement.gs.
         */

        const payload = {

            schoolId:
                currentSession.schoolId,

            sessionId:
                currentSelected.sessionId,

            term:
                currentSelected.term,

            classId:
                currentSelected.classId

        };


        const responses =
            await Promise.all([

                apiRequest(
                    'getResultManagementOverview',
                    payload
                ),

                apiRequest(
                    'getResultManagementStudents',
                    payload
                )

            ]);


        const overview =
            responses[0];


        const students =
            responses[1];


        if (!overview.success) {

            throw new Error(
                overview.error ||
                overview.message ||
                'Could not load result overview.'
            );

        }


        if (!students.success) {

            throw new Error(
                students.error ||
                students.message ||
                'Could not load student results.'
            );

        }


        currentOverview =
            overview;


        currentStudents =
            Array.isArray(
                students.students
            )
                ? students.students
                : [];


        renderOverview(
            overview
        );


        renderStudents(
            currentStudents
        );


        hideSelectionLoading();

        hideSelectionMessage();


    } catch (error) {

        console.error(
            'Result management error:',
            error
        );


        hideSelectionLoading();

        hideResultSections();

        showMessage(
            error.message ||
            'Could not load result management data.'
        );

    }

}


/* ============================================================
   OVERVIEW LOADING
============================================================ */

function setOverviewLoading() {

    const section =
        document.getElementById(
            'overviewSection'
        );


    if (!section) {
        return;
    }


    section.classList.remove(
        'hidden'
    );


    document.getElementById(
        'overviewTitle'
    ).textContent =
        'Loading result overview...';


    document.getElementById(
        'overviewSubtitle'
    ).textContent =
        'Please wait while result information is loaded.';


    document.getElementById(
        'totalStudents'
    ).textContent =
        '—';


    document.getElementById(
        'completedStudents'
    ).textContent =
        '—';


    document.getElementById(
        'incompleteStudents'
    ).textContent =
        '—';


    document.getElementById(
        'notStartedStudents'
    ).textContent =
        '—';


    document.getElementById(
        'readinessBadge'
    ).textContent =
        'Checking...';


    document.getElementById(
        'readinessBadge'
    ).className =
        'readiness-badge';


    const validationPanel =
        document.getElementById(
            'validationPanel'
        );


    if (validationPanel) {

        validationPanel.className =
            'validation-panel';

    }

}


/* ============================================================
   RENDER OVERVIEW
============================================================ */

function renderOverview(data) {

    const section =
        document.getElementById(
            'overviewSection'
        );


    if (section) {

        section.classList.remove(
            'hidden'
        );

    }


    const classData =
        data.class || {};


    const students =
        data.students || {};


    const validation =
        data.validation || {};


    const overviewTitle =
        document.getElementById(
            'overviewTitle'
        );


    const overviewSubtitle =
        document.getElementById(
            'overviewSubtitle'
        );


    if (overviewTitle) {

        overviewTitle.textContent =
            buildClassName({

                className:
                    classData.className,

                section:
                    classData.section

            });

    }


    if (overviewSubtitle) {

        overviewSubtitle.textContent =
            (
                (data.session &&
                    data.session.sessionName
                )
                    ? data.session.sessionName
                    : currentSelected.sessionId
            ) +
            ' • ' +
            currentSelected.term;

    }


    document.getElementById(
        'totalStudents'
    ).textContent =
        safeNumber(
            students.total
        );


    document.getElementById(
        'completedStudents'
    ).textContent =
        safeNumber(
            students.complete
        );


    document.getElementById(
        'incompleteStudents'
    ).textContent =
        safeNumber(
            students.incomplete
        );


    document.getElementById(
        'notStartedStudents'
    ).textContent =
        safeNumber(
            students.notStarted
        );


    renderReadiness(
        data.readyForPdf === true,
        validation
    );

}


/* ============================================================
   READINESS
============================================================ */

function renderReadiness(
    ready,
    validation
) {

    const badge =
        document.getElementById(
            'readinessBadge'
        );


    const panel =
        document.getElementById(
            'validationPanel'
        );


    const title =
        document.getElementById(
            'validationTitle'
        );


    const message =
        document.getElementById(
            'validationMessage'
        );


    const icon =
        panel
            ? panel.querySelector(
                '.validation-icon'
            )
            : null;


    if (ready) {

        if (badge) {

            badge.textContent =
                'Ready for PDF';

            badge.className =
                'readiness-badge ready';

        }


        if (panel) {

            panel.className =
                'validation-panel ready';

        }


        if (icon) {

            icon.textContent =
                '✓';

        }


        if (title) {

            title.textContent =
                'Results are ready';

        }


        if (message) {

            message.textContent =
                'The class has passed the current result validation checks and is ready for result generation.';

        }


        return;

    }


    if (badge) {

        badge.textContent =
            'Not Ready';

        badge.className =
            'readiness-badge not-ready';

    }


    if (panel) {

        panel.className =
            'validation-panel error';

    }


    if (icon) {

        icon.textContent =
            '!';

    }


    if (title) {

        title.textContent =
            'Results need attention';

    }


    if (message) {

        message.textContent =
            buildValidationMessage(
                validation
            );

    }

}


/* ============================================================
   VALIDATION MESSAGE
============================================================ */

function buildValidationMessage(
    validation
) {

    if (!validation) {

        return (
            'The result validation could not confirm that this class is ready.'
        );

    }


    const parts = [];


    const missing =
        getValidationCount(
            validation,
            [
                'missingScores',
                'missing',
                'missingCount'
            ]
        );


    const invalid =
        getValidationCount(
            validation,
            [
                'invalidScores',
                'invalid',
                'invalidCount'
            ]
        );


    if (missing > 0) {

        parts.push(
            missing +
            ' missing score' +
            (missing === 1 ? '' : 's')
        );

    }


    if (invalid > 0) {

        parts.push(
            invalid +
            ' invalid score' +
            (invalid === 1 ? '' : 's')
        );

    }


    if (parts.length) {

        return (
            'Please resolve ' +
            parts.join(' and ') +
            ' before generating final results.'
        );

    }


    return (
        'Some result requirements are not yet complete. Review the student statuses below.'
    );

}


/* ============================================================
   VALIDATION COUNT
============================================================ */

function getValidationCount(
    validation,
    keys
) {

    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const value =
            validation[keys[i]];


        if (
            typeof value === 'number'
        ) {

            return value;

        }


        if (
            Array.isArray(value)
        ) {

            return value.length;

        }


        if (
            value &&
            typeof value === 'object' &&
            typeof value.count === 'number'
        ) {

            return value.count;

        }

    }


    return 0;

}


/* ============================================================
   TABLE LOADING
============================================================ */

function setTableLoading() {

    const loading =
        document.getElementById(
            'tableLoading'
        );


    const empty =
        document.getElementById(
            'tableEmpty'
        );


    const table =
        document.getElementById(
            'resultsTable'
        );


    const section =
        document.getElementById(
            'studentsSection'
        );


    if (section) {

        section.classList.remove(
            'hidden'
        );

    }


    if (loading) {

        loading.classList.remove(
            'hidden'
        );

    }


    if (empty) {

        empty.classList.add(
            'hidden'
        );

    }


    if (table) {

        table.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   RENDER STUDENTS
============================================================ */

function renderStudents(
    students
) {

    const section =
        document.getElementById(
            'studentsSection'
        );


    const loading =
        document.getElementById(
            'tableLoading'
        );


    const empty =
        document.getElementById(
            'tableEmpty'
        );


    const table =
        document.getElementById(
            'resultsTable'
        );


    const tbody =
        document.getElementById(
            'resultsTableBody'
        );


    const count =
        document.getElementById(
            'recordCount'
        );


    if (section) {

        section.classList.remove(
            'hidden'
        );

    }


    if (loading) {

        loading.classList.add(
            'hidden'
        );

    }


    if (count) {

        count.textContent =
            students.length +
            (
                students.length === 1
                    ? ' student'
                    : ' students'
            );

    }


    if (!students.length) {

        if (empty) {

            empty.classList.remove(
                'hidden'
            );

        }


        if (table) {

            table.classList.add(
                'hidden'
            );

        }


        return;

    }


    if (empty) {

        empty.classList.add(
            'hidden'
        );

    }


    if (table) {

        table.classList.remove(
            'hidden'
        );

    }


    if (!tbody) {
        return;
    }


    tbody.innerHTML = '';


    students.forEach(
        function (student) {

            const row =
                document.createElement(
                    'tr'
                );


            const admissionCell =
                document.createElement(
                    'td'
                );


            admissionCell.innerHTML =
                '<span class="admission-number">' +
                escapeHtml(
                    student.admissionNo ||
                    '—'
                ) +
                '</span>';


            const nameCell =
                document.createElement(
                    'td'
                );


            nameCell.innerHTML =
                '<span class="student-name">' +
                escapeHtml(
                    student.fullName ||
                    'Unnamed Student'
                ) +
                '</span>';


            const totalCell =
                document.createElement(
                    'td'
                );


            totalCell.innerHTML =
                '<span class="numeric-value">' +
                formatNumber(
                    student.total
                ) +
                '</span>';


            const averageCell =
                document.createElement(
                    'td'
                );


            averageCell.innerHTML =
                '<span class="numeric-value">' +
                formatAverage(
                    student.average
                ) +
                '</span>';


            const positionCell =
                document.createElement(
                    'td'
                );


            if (
                student.position !== null &&
                student.position !== undefined &&
                student.position !== ''
            ) {

                positionCell.innerHTML =
                    '<span class="position-value">' +
                    escapeHtml(
                        String(
                            student.position
                        )
                    ) +
                    '</span>';

            } else {

                positionCell.innerHTML =
                    '<span class="position-empty">—</span>';

            }


            const statusCell =
                document.createElement(
                    'td'
                );


            statusCell.innerHTML =
                createStatusBadge(
                    student.completionStatus
                );


            const actionCell =
                document.createElement(
                    'td'
                );


            const viewButton =
                document.createElement(
                    'button'
                );


            viewButton.type =
                'button';


            viewButton.className =
                'view-button';


            viewButton.textContent =
                'View Result';


            viewButton.addEventListener(
                'click',
                function () {

                    openStudentResult(
                        student.studentId
                    );

                }
            );


            actionCell.appendChild(
                viewButton
            );


            row.appendChild(
                admissionCell
            );

            row.appendChild(
                nameCell
            );

            row.appendChild(
                totalCell
            );

            row.appendChild(
                averageCell
            );

            row.appendChild(
                positionCell
            );

            row.appendChild(
                statusCell
            );

            row.appendChild(
                actionCell
            );


            tbody.appendChild(
                row
            );

        }
    );

}


/* ============================================================
   STATUS BADGE
============================================================ */

function createStatusBadge(
    status
) {

    const normalized =
        normalize(
            status
        );


    let className =
        'status-not-started';


    let label =
        status ||
        'Not Started';


    if (
        normalized === 'complete'
    ) {

        className =
            'status-complete';

        label =
            'Complete';

    } else if (
        normalized === 'incomplete'
    ) {

        className =
            'status-incomplete';

        label =
            'Incomplete';

    } else {

        className =
            'status-not-started';

        label =
            'Not Started';

    }


    return (
        '<span class="status-badge ' +
        className +
        '">' +
        escapeHtml(label) +
        '</span>'
    );

}


/* ============================================================
   OPEN STUDENT RESULT
============================================================ */

async function openStudentResult(
    studentId
) {

    if (!studentId) {

        showMessage(
            'Student ID is missing.'
        );

        return;

    }


    const modal =
        document.getElementById(
            'studentResultModal'
        );


    const body =
        document.getElementById(
            'resultModalBody'
        );


    if (!modal || !body) {
        return;
    }


    modal.classList.remove(
        'hidden'
    );


    body.innerHTML = `
        <div class="result-loading">
            <div class="loading-spinner"></div>
            <span>Loading result...</span>
        </div>
    `;


    document.body.style.overflow =
        'hidden';


    try {

        const result =
            await apiRequest(
                'getResultManagementStudent',
                {

                    schoolId:
                        currentSession.schoolId,

                    sessionId:
                        currentSelected.sessionId,

                    term:
                        currentSelected.term,

                    studentId:
                        studentId

                }
            );


        if (!result.success) {

            throw new Error(
                result.error ||
                result.message ||
                'Student result could not be loaded.'
            );

        }


        renderStudentResult(
            result.result
        );


    } catch (error) {

        console.error(
            'Student result error:',
            error
        );


        body.innerHTML = `
            <div class="table-empty">
                <div class="empty-icon">!</div>
                <strong>Could not load result</strong>
                <span>${escapeHtml(
                    error.message ||
                    'An error occurred.'
                )}</span>
            </div>
        `;

    }

}


/* ============================================================
   RENDER STUDENT RESULT
============================================================ */

function renderStudentResult(
    result
) {

    const body =
        document.getElementById(
            'resultModalBody'
        );


    if (!body) {
        return;
    }


    if (!result) {

        body.innerHTML = `
            <div class="table-empty">
                <div class="empty-icon">!</div>
                <strong>No result found</strong>
                <span>This student does not have a result for the selected period.</span>
            </div>
        `;

        return;

    }


    /*
     * FinalResults.gs may contain slightly different
     * nested structures depending on the existing
     * result engine. We read the common structures
     * safely rather than assuming a single shape.
     */

    const student =
        result.student ||
        {};


    const summary =
        result.summary ||
        {};


    const subjects =
        Array.isArray(
            result.subjects
        )
            ? result.subjects
            : (
                Array.isArray(
                    result.results
                )
                    ? result.results
                    : []
            );


    const comments =
        result.comments ||
        {};


    const fullName =
        firstValue(
            student.fullName,
            student.name,
            result.fullName,
            'Student'
        );


    const admissionNo =
        firstValue(
            student.admissionNo,
            student.admissionNumber,
            result.admissionNo,
            '—'
        );


    const total =
        firstValue(
            summary.overallTotal,
            summary.total,
            result.total,
            null
        );


    const average =
        firstValue(
            summary.average,
            result.average,
            null
        );


    const position =
        firstValue(
            summary.position,
            result.position,
            null
        );


    const completionStatus =
        firstValue(
            summary.completionStatus,
            result.completionStatus,
            'Not Started'
        );


    const studentTitle =
        document.getElementById(
            'studentResultTitle'
        );


    if (studentTitle) {

        studentTitle.textContent =
            fullName;

    }


    body.innerHTML = `

        <div class="result-student-header">

            <h3>
                ${escapeHtml(fullName)}
            </h3>

            <div class="result-student-meta">

                <span>
                    Admission No.:
                    <strong>
                        ${escapeHtml(
                            admissionNo
                        )}
                    </strong>
                </span>

                <span>
                    ${escapeHtml(
                        currentSelected.term
                    )}
                </span>

            </div>

        </div>


        <div class="result-detail-summary">

            <div class="result-detail-card">

                <span>
                    TOTAL
                </span>

                <strong>
                    ${formatNumber(total)}
                </strong>

            </div>


            <div class="result-detail-card">

                <span>
                    AVERAGE
                </span>

                <strong>
                    ${formatAverage(average)}
                </strong>

            </div>


            <div class="result-detail-card">

                <span>
                    POSITION
                </span>

                <strong>
                    ${
                        position !== null &&
                        position !== undefined &&
                        position !== ''
                            ? escapeHtml(
                                String(position)
                            )
                            : '—'
                    }
                </strong>

            </div>

        </div>


        <div class="result-detail-section">

            <h4>
                Result Status
            </h4>

            ${createStatusBadge(
                completionStatus
            )}

        </div>


        ${
            subjects.length
                ? createSubjectResultsTable(
                    subjects
                )
                : ''
        }


        ${createCommentsSection(
            comments
        )}

    `;

}


/* ============================================================
   SUBJECT TABLE
============================================================ */

function createSubjectResultsTable(
    subjects
) {

    let rows = '';


    subjects.forEach(
        function (subject) {

            const subjectName =
                firstValue(
                    subject.subjectName,
                    subject.subject,
                    subject.name,
                    subject['Subject Name'],
                    'Subject'
                );


            const test =
                firstValue(
                    subject.testScore,
                    subject.test,
                    subject.testMark,
                    null
                );


            const exam =
                firstValue(
                    subject.examScore,
                    subject.exam,
                    subject.examMark,
                    null
                );


            const total =
                firstValue(
                    subject.totalScore,
                    subject.total,
                    null
                );


            const grade =
                firstValue(
                    subject.grade,
                    subject.Grade,
                    '—'
                );


            const remark =
                firstValue(
                    subject.remark,
                    subject.Remark,
                    '—'
                );


            rows += `

                <tr>

                    <td>
                        ${escapeHtml(
                            subjectName
                        )}
                    </td>

                    <td>
                        ${formatNumber(test)}
                    </td>

                    <td>
                        ${formatNumber(exam)}
                    </td>

                    <td>
                        ${formatNumber(total)}
                    </td>

                    <td>
                        ${escapeHtml(
                            String(grade)
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            String(remark)
                        )}
                    </td>

                </tr>

            `;

        }
    );


    return `

        <div class="result-detail-section">

            <h4>
                Subject Results
            </h4>

            <div class="result-detail-table-wrapper">

                <table class="result-detail-table">

                    <thead>

                        <tr>

                            <th>
                                Subject
                            </th>

                            <th>
                                Test
                            </th>

                            <th>
                                Exam
                            </th>

                            <th>
                                Total
                            </th>

                            <th>
                                Grade
                            </th>

                            <th>
                                Remark
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rows}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}


/* ============================================================
   COMMENTS
============================================================ */

function createCommentsSection(
    comments
) {

    if (!comments) {

        return '';

    }


    const teacherComment =
        firstValue(
            comments.teacherComment,
            comments['Teacher Comment'],
            ''
        );


    const principalComment =
        firstValue(
            comments.principalComment,
            comments['Principal Comment'],
            ''
        );


    if (
        !teacherComment &&
        !principalComment
    ) {

        return '';

    }


    return `

        <div class="result-detail-section">

            <h4>
                Comments
            </h4>


            ${
                teacherComment
                    ? `
                        <p>
                            <strong>
                                Teacher:
                            </strong>
                            ${escapeHtml(
                                teacherComment
                            )}
                        </p>
                    `
                    : ''
            }


            ${
                principalComment
                    ? `
                        <p>
                            <strong>
                                Principal:
                            </strong>
                            ${escapeHtml(
                                principalComment
                            )}
                        </p>
                    `
                    : ''
            }

        </div>

    `;

}


/* ============================================================
   CLOSE RESULT MODAL
============================================================ */

function closeStudentResultModal() {

    const modal =
        document.getElementById(
            'studentResultModal'
        );


    if (modal) {

        modal.classList.add(
            'hidden'
        );

    }


    document.body.style.overflow =
        '';

}


/* ============================================================
   HIDE RESULT SECTIONS
============================================================ */

function hideResultSections() {

    const overview =
        document.getElementById(
            'overviewSection'
        );


    const students =
        document.getElementById(
            'studentsSection'
        );


    if (overview) {

        overview.classList.add(
            'hidden'
        );

    }


    if (students) {

        students.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   SELECTION LOADING
============================================================ */

function showSelectionLoading() {

    const message =
        document.getElementById(
            'selectionMessage'
        );


    const text =
        document.getElementById(
            'selectionMessageText'
        );


    if (message) {

        message.classList.remove(
            'hidden'
        );

    }


    if (text) {

        text.textContent =
            'Loading result management data...';

    }

}


function hideSelectionLoading() {

    hideSelectionMessage();

}


/* ============================================================
   SELECTION MESSAGE
============================================================ */

function showSelectionMessage(
    messageText
) {

    const message =
        document.getElementById(
            'selectionMessage'
        );


    const text =
        document.getElementById(
            'selectionMessageText'
        );


    if (message) {

        message.classList.remove(
            'hidden'
        );

    }


    if (text) {

        text.textContent =
            messageText;

    }

}


function hideSelectionMessage() {

    const message =
        document.getElementById(
            'selectionMessage'
        );


    if (message) {

        message.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
    action,
    payload
) {

    const requestBody = {

        action:
            action,

        ...payload

    };


    const response =
        await fetch(
            API_URL,
            {

                method: 'POST',

                headers: {

                    'Content-Type':
                        'text/plain;charset=utf-8'

                },

                body:
                    JSON.stringify(
                        requestBody
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


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            'Invalid server response:',
            text
        );


        throw new Error(
            'The server returned an invalid response.'
        );

    }


    return data;

}


/* ============================================================
   MESSAGE
============================================================ */

function showMessage(
    message
) {

    const pageMessage =
        document.getElementById(
            'pageMessage'
        );


    const messageText =
        document.getElementById(
            'messageText'
        );


    if (!pageMessage) {
        return;
    }


    if (messageText) {

        messageText.textContent =
            message ||
            'Something went wrong.';

    }


    pageMessage.classList.remove(
        'hidden'
    );


    window.scrollTo({

        top: 0,

        behavior: 'smooth'

    });

}


function hideMessage() {

    const pageMessage =
        document.getElementById(
            'pageMessage'
        );


    if (pageMessage) {

        pageMessage.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );


    currentSession =
        null;


    window.location.href =
        'index.html';

}


/* ============================================================
   LOGIN REDIRECT
============================================================ */

function redirectToLogin() {

    window.location.href =
        'index.html';

}


/* ============================================================
   HELPERS
============================================================ */

function normalize(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)
        .trim()
        .toLowerCase();

}


function safeNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '0';

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return '0';

    }


    return String(number);

}


function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '—';

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            String(value)
        );

    }


    return Number.isInteger(number)
        ? String(number)
        : number.toFixed(2);

}


function formatAverage(value) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '—';

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            String(value)
        );

    }


    return number.toFixed(2);

}


function firstValue() {

    const values =
        Array.from(
            arguments
        );


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        const value =
            values[i];


        if (
            value !== null &&
            value !== undefined &&
            value !== ''
        ) {

            return value;

        }

    }


    return null;

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)
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
