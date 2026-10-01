/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: result-management.js
   VERSION: 1.1.1

   PURPOSE:
   - Result management
   - Session / term / class selection
   - Result overview
   - Student result list
   - Individual student result modal
   - Result comments
   - Position display
   - Validation / readiness display
============================================================ */


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

let currentSession = null;
let setupData = null;
let currentStudents = [];

let currentSelection = {
    sessionId: '',
    term: '',
    classId: ''
};

let currentStudentResult = null;


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
   INITIALIZE PAGE
============================================================ */

async function initializePage() {

    restoreSession();

    if (!currentSession) {
        redirectToLogin();
        return;
    }

    populateUserInformation();

    bindEvents();

    await loadSetup();

}


/* ============================================================
   SESSION
============================================================ */

function restoreSession() {

    const raw =
        localStorage.getItem(
            SESSION_KEY
        );

    if (!raw) {

        currentSession = null;

        return;

    }


    try {

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            typeof parsed !== 'object'
        ) {

            currentSession = null;

            return;

        }


        currentSession =
            normalizeSession(parsed);


    } catch (error) {

        console.error(
            'Session parsing failed:',
            error
        );

        currentSession = null;

    }

}


function normalizeSession(parsed) {

    const user =
        parsed.user || {};

    const school =
        parsed.school || {};


    return {

        user: {

            userId:
                parsed.userId ||
                user.userId ||
                user['User ID'] ||
                '',

            schoolId:
                parsed.schoolId ||
                user.schoolId ||
                user['School ID'] ||
                school.schoolId ||
                school['School ID'] ||
                '',

            fullName:
                parsed.fullName ||
                user.fullName ||
                user['Full Name'] ||
                '',

            email:
                parsed.email ||
                user.email ||
                user['Email'] ||
                '',

            role:
                parsed.role ||
                user.role ||
                user['Role'] ||
                ''

        },

        school: {

            schoolId:
                parsed.schoolId ||
                school.schoolId ||
                school['School ID'] ||
                user.schoolId ||
                '',

            schoolName:
                parsed.schoolName ||
                school.schoolName ||
                school['School Name'] ||
                '',

            schoolCode:
                parsed.schoolCode ||
                school.schoolCode ||
                school['School Code'] ||
                '',

            plan:
                parsed.plan ||
                school.plan ||
                school['Plan'] ||
                '',

            status:
                parsed.status ||
                school.status ||
                school['Status'] ||
                '',

            expiryDate:
                parsed.expiryDate ||
                school.expiryDate ||
                school['Expiry Date'] ||
                ''

        }

    };

}


function getSchoolId() {

    if (
        currentSession &&
        currentSession.user &&
        currentSession.user.schoolId
    ) {

        return currentSession.user.schoolId;

    }


    if (
        currentSession &&
        currentSession.school &&
        currentSession.school.schoolId
    ) {

        return currentSession.school.schoolId;

    }


    return '';

}


/* ============================================================
   USER / HEADER
============================================================ */

function populateUserInformation() {

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

    const userInitials =
        document.getElementById(
            'userInitials'
        );


    const school =
        currentSession.school || {};

    const user =
        currentSession.user || {};


    if (schoolName) {

        schoolName.textContent =
            school.schoolName ||
            'School Results System';

    }


    if (userName) {

        userName.textContent =
            user.fullName ||
            'User';

    }


    if (userRole) {

        userRole.textContent =
            user.role ||
            'Administrator';

    }


    if (userInitials) {

        userInitials.textContent =
            getInitials(
                user.fullName ||
                school.schoolName ||
                'SR'
            );

    }

}


function getInitials(name) {

    const words =
        String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {

        return 'SR';

    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
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


/* ============================================================
   SETUP
============================================================ */

async function loadSetup() {

    hideMessage();

    hideSelectionMessage();


    const schoolId =
        getSchoolId();


    if (!schoolId) {

        showMessage(
            'Your school session could not be identified. Please log in again.'
        );

        return;

    }


    try {

        const response =
            await apiRequest(
                'getResultManagementSetup',
                {
                    schoolId: schoolId
                }
            );


        if (!response.success) {

            throw new Error(
                response.message ||
                'Unable to load result management setup.'
            );

        }


        setupData =
            response;


        populateSessions(
            response.sessions || []
        );


        populateTerms(
            response.terms || []
        );


        populateClasses(
            response.classes || []
        );


        selectDefaultValues(
            response
        );


        await loadResultManagement();


    } catch (error) {

        console.error(
            'loadSetup error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to load result management.'
        );


        hideResultSections();

    }

}


/* ============================================================
   POPULATE SESSIONS
============================================================ */

function populateSessions(sessions) {

    const select =
        document.getElementById(
            'sessionSelect'
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        '<option value="">Select session</option>';


    sessions.forEach(
        function (session) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                session.sessionId || '';


            option.textContent =
                session.sessionName || '';


            select.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   POPULATE TERMS
============================================================ */

function populateTerms(terms) {

    const select =
        document.getElementById(
            'termSelect'
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        '<option value="">Select term</option>';


    terms.forEach(
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
   POPULATE CLASSES
============================================================ */

function populateClasses(classes) {

    const select =
        document.getElementById(
            'classSelect'
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        '<option value="">Select class</option>';


    classes.forEach(
        function (item) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                item.classId || '';


            option.textContent =
                buildClassName(item);


            select.appendChild(
                option
            );

        }
    );

}


function buildClassName(item) {

    const name =
        item.className || '';

    const section =
        item.section || '';


    if (section) {

        return name +
            ' - ' +
            section;

    }


    return name;

}


/* ============================================================
   DEFAULT SELECTIONS
============================================================ */

function selectDefaultValues(response) {

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


    const sessions =
        response.sessions || [];

    const terms =
        response.terms || [];

    const classes =
        response.classes || [];


    let selectedSession =
        sessions.find(
            function (session) {

                return normalizeStatus(
                    session.status
                ) === 'active';

            }
        );


    if (
        !selectedSession &&
        sessions.length
    ) {

        selectedSession =
            sessions[0];

    }


    if (
        selectedSession &&
        sessionSelect
    ) {

        sessionSelect.value =
            selectedSession.sessionId || '';

        currentSelection.sessionId =
            selectedSession.sessionId || '';

    }


    let selectedTerm =
        terms.find(
            function (term) {

                return String(term)
                    .trim()
                    .toLowerCase() ===
                    'first term';

            }
        );


    if (
        !selectedTerm &&
        terms.length
    ) {

        selectedTerm =
            terms[0];

    }


    if (
        selectedTerm &&
        termSelect
    ) {

        termSelect.value =
            selectedTerm;

        currentSelection.term =
            selectedTerm;

    }


    let selectedClass =
        classes.find(
            function (item) {

                return normalizeStatus(
                    item.status
                ) === 'active';

            }
        );


    if (
        !selectedClass &&
        classes.length
    ) {

        selectedClass =
            classes[0];

    }


    if (
        selectedClass &&
        classSelect
    ) {

        classSelect.value =
            selectedClass.classId || '';

        currentSelection.classId =
            selectedClass.classId || '';

    }

}


/* ============================================================
   SELECTION CHANGE
============================================================ */

async function handleSelectionChange() {

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


    currentSelection = {

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
        !currentSelection.sessionId ||
        !currentSelection.term ||
        !currentSelection.classId
    ) {

        hideResultSections();

        showSelectionMessage(
            'Select a session, term and class to view results.'
        );

        return;

    }


    hideSelectionMessage();

    await loadResultManagement();

}


/* ============================================================
   LOAD RESULT MANAGEMENT
============================================================ */

async function loadResultManagement() {

    const schoolId =
        getSchoolId();

    const sessionId =
        currentSelection.sessionId;

    const term =
        currentSelection.term;

    const classId =
        currentSelection.classId;


    if (
        !schoolId ||
        !sessionId ||
        !term ||
        !classId
    ) {

        hideResultSections();

        return;

    }


    showLoadingState();


    const payload = {

        schoolId:
            schoolId,

        sessionId:
            sessionId,

        term:
            term,

        classId:
            classId

    };


    try {

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


        const overviewResponse =
            responses[0];

        const studentsResponse =
            responses[1];


        if (
            !overviewResponse.success
        ) {

            throw new Error(
                overviewResponse.message ||
                'Unable to load result overview.'
            );

        }


        if (
            !studentsResponse.success
        ) {

            throw new Error(
                studentsResponse.message ||
                'Unable to load student results.'
            );

        }


        renderOverview(
            overviewResponse
        );


        renderStudents(
            studentsResponse
        );


    } catch (error) {

        console.error(
            'loadResultManagement error:',
            error
        );


        hideResultSections();


        showMessage(
            error.message ||
            'Unable to load results.'
        );

    }

}


/* ============================================================
   LOADING STATE
============================================================ */

function showLoadingState() {

    const overview =
        document.getElementById(
            'overviewSection'
        );

    const students =
        document.getElementById(
            'studentsSection'
        );

    const loading =
        document.getElementById(
            'tableLoading'
        );

    const table =
        document.getElementById(
            'resultsTable'
        );

    const empty =
        document.getElementById(
            'tableEmpty'
        );


    if (overview) {

        overview.classList.remove(
            'hidden'
        );

    }


    if (students) {

        students.classList.remove(
            'hidden'
        );

    }


    if (loading) {

        loading.classList.remove(
            'hidden'
        );

    }


    if (table) {

        table.classList.add(
            'hidden'
        );

    }


    if (empty) {

        empty.classList.add(
            'hidden'
        );

    }

}


/* ============================================================
   RENDER OVERVIEW
============================================================ */

function renderOverview(response) {

    const students =
        response.students || {};

    const validation =
        response.validation || {};

    const school =
        response.school || {};

    const session =
        response.session || {};

    const classData =
        response.class || {};


    const total =
        Number(
            students.total || 0
        );

    const complete =
        Number(
            students.complete || 0
        );

    const incomplete =
        Number(
            students.incomplete || 0
        );

    const notStarted =
        Number(
            students.notStarted || 0
        );


    setText(
        'totalStudents',
        total
    );


    setText(
        'completedStudents',
        complete
    );


    setText(
        'incompleteStudents',
        incomplete
    );


    setText(
        'notStartedStudents',
        notStarted
    );


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
            (
                classData.className ||
                'Class'
            ) +
            ' Result Overview';

    }


    if (overviewSubtitle) {

        const sessionName =
            session.sessionName ||
            currentSelection.sessionId;


        overviewSubtitle.textContent =
            (
                school.schoolName ||
                'School'
            ) +
            ' • ' +
            sessionName +
            ' • ' +
            currentSelection.term;

    }


    renderReadiness(
        response.readyForPdf === true,
        validation
    );

}


/* ============================================================
   SET TEXT
============================================================ */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value === null ||
        value === undefined
            ? ''
            : String(value);

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


    if (badge) {

        badge.textContent =
            ready
                ? 'Ready for PDF'
                : 'Not Ready';


        badge.classList.remove(
            'ready',
            'not-ready',
            'success',
            'warning'
        );


        badge.classList.add(
            ready
                ? 'ready'
                : 'not-ready'
        );

    }


    if (panel) {

        panel.classList.remove(
            'ready',
            'not-ready',
            'success',
            'warning'
        );


        panel.classList.add(
            ready
                ? 'ready'
                : 'not-ready'
        );

    }


    if (title) {

        title.textContent =
            ready
                ? 'Results are ready'
                : 'Results need attention';

    }


    if (message) {

        message.textContent =
            getValidationMessage(
                ready,
                validation
            );

    }

}


function getValidationMessage(
    ready,
    validation
) {

    if (ready) {

        return 'All required scores have been completed and the class results are ready for result generation.';

    }


    if (
        validation &&
        validation.message
    ) {

        return validation.message;

    }


    const missing =
        Number(
            validation &&
            validation.missingCount
                ? validation.missingCount
                : 0
        );


    const invalid =
        Number(
            validation &&
            validation.invalidCount
                ? validation.invalidCount
                : 0
        );


    if (
        missing > 0 &&
        invalid > 0
    ) {

        return (
            missing +
            ' missing score record(s) and ' +
            invalid +
            ' invalid score record(s) need attention.'
        );

    }


    if (missing > 0) {

        return (
            missing +
            ' student result record(s) still have missing scores.'
        );

    }


    if (invalid > 0) {

        return (
            invalid +
            ' invalid score record(s) need attention.'
        );

    }


    return 'Some result records still need attention before the class result can be finalized.';

}


/* ============================================================
   RENDER STUDENTS
============================================================ */

function renderStudents(response) {

    const students =
        response.students || [];


    currentStudents =
        students;


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

    const recordCount =
        document.getElementById(
            'recordCount'
        );


    if (loading) {

        loading.classList.add(
            'hidden'
        );

    }


    if (recordCount) {

        recordCount.textContent =
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

            tbody.appendChild(
                createStudentRow(
                    student
                )
            );

        }
    );

}


/* ============================================================
   CREATE STUDENT ROW
============================================================ */

function createStudentRow(student) {

    const row =
        document.createElement(
            'tr'
        );


    const admissionCell =
        document.createElement(
            'td'
        );

    admissionCell.textContent =
        safeDisplay(
            student.admissionNo
        );


    const nameCell =
        document.createElement(
            'td'
        );

    nameCell.className =
        'student-name-cell';

    nameCell.textContent =
        safeDisplay(
            student.fullName
        );


    const totalCell =
        document.createElement(
            'td'
        );

    totalCell.textContent =
        formatNumber(
            student.total
        );


    const averageCell =
        document.createElement(
            'td'
        );

    averageCell.textContent =
        formatAverage(
            student.average
        );


    const positionCell =
        document.createElement(
            'td'
        );

    positionCell.textContent =
        formatPosition(
            student.position
        );


    const statusCell =
        document.createElement(
            'td'
        );

    statusCell.appendChild(
        createStatusBadge(
            student.completionStatus
        )
    );


    const actionCell =
        document.createElement(
            'td'
        );


    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';

    button.className =
        'view-result-button';

    button.textContent =
        'View Result';


    button.addEventListener(
        'click',
        function () {

            openStudentResult(
                student
            );

        }
    );


    actionCell.appendChild(
        button
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


    return row;

}


/* ============================================================
   STATUS BADGE
============================================================ */

function createStatusBadge(status) {

    const badge =
        document.createElement(
            'span'
        );


    const normalized =
        normalizeStatus(
            status
        );


    badge.className =
        'result-status';


    if (
        normalized ===
        'complete'
    ) {

        badge.classList.add(
            'status-complete'
        );

        badge.textContent =
            'Complete';

        return badge;

    }


    if (
        normalized ===
        'incomplete'
    ) {

        badge.classList.add(
            'status-incomplete'
        );

        badge.textContent =
            'Incomplete';

        return badge;

    }


    badge.classList.add(
        'status-not-started'
    );


    badge.textContent =
        'Not Started';


    return badge;

}


/* ============================================================
   OPEN STUDENT RESULT
============================================================ */

async function openStudentResult(
    student
) {

    if (
        !student ||
        !student.studentId
    ) {

        showMessage(
            'The selected student could not be identified.'
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

    const title =
        document.getElementById(
            'studentResultTitle'
        );


    if (
        !modal ||
        !body
    ) {

        return;

    }


    if (title) {

        title.textContent =
            student.fullName ||
            'Student Result';

    }


    body.innerHTML =
        getResultLoadingMarkup();


    modal.classList.remove(
        'hidden'
    );


    document.body.classList.add(
        'modal-open'
    );


    const schoolId =
        getSchoolId();


    try {

        const response =
            await apiRequest(
                'getResultManagementStudent',
                {
                    schoolId:
                        schoolId,

                    sessionId:
                        currentSelection.sessionId,

                    term:
                        currentSelection.term,

                    studentId:
                        student.studentId
                }
            );


        if (!response.success) {

            throw new Error(
                response.message ||
                'Unable to load this student result.'
            );

        }


        currentStudentResult =
            response.result || null;


        renderStudentResult(
            response.result || {},
            student
        );


    } catch (error) {

        console.error(
            'openStudentResult error:',
            error
        );


        body.innerHTML =
            getResultErrorMarkup(
                error.message ||
                'Unable to load the student result.'
            );

    }

}


/* ============================================================
   CLOSE STUDENT RESULT
============================================================ */

function closeStudentResultModal() {

    const modal =
        document.getElementById(
            'studentResultModal'
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        'hidden'
    );


    document.body.classList.remove(
        'modal-open'
    );


    currentStudentResult =
        null;

}


/* ============================================================
   RESULT LOADING MARKUP
============================================================ */

function getResultLoadingMarkup() {

    return `
        <div class="result-loading">

            <div class="loading-spinner"></div>

            <span>
                Loading result...
            </span>

        </div>
    `;

}


/* ============================================================
   RESULT ERROR MARKUP
============================================================ */

function getResultErrorMarkup(
    message
) {

    return `
        <div class="result-error">

            <strong>
                Unable to load result
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>
    `;

}


/* ============================================================
   RENDER STUDENT RESULT
============================================================ */

function renderStudentResult(
    result,
    fallbackStudent
) {

    const body =
        document.getElementById(
            'resultModalBody'
        );


    if (!body) {

        return;

    }


    const student =
        result.student ||
        fallbackStudent ||
        {};


    const summary =
        result.summary ||
        {};


    const subjects =
        Array.isArray(
            result.subjects
        )
            ? result.subjects
            : Array.isArray(
                result.results
            )
                ? result.results
                : [];


    const comments =
        result.comments ||
        {};


    body.innerHTML = '';


    body.appendChild(
        buildStudentInformation(
            result,
            student
        )
    );


    body.appendChild(
        buildPerformanceSummary(
            summary,
            result
        )
    );


    body.appendChild(
        buildSubjectResults(
            subjects
        )
    );


    body.appendChild(
        buildCommentsSection(
            comments
        )
    );

}


/* ============================================================
   STUDENT INFORMATION
============================================================ */

function buildStudentInformation(
    result,
    student
) {

    const section =
        document.createElement(
            'section'
        );


    section.className =
        'result-section student-result-information';


    const title =
        document.createElement(
            'div'
        );


    title.className =
        'result-section-title';


    title.textContent =
        'STUDENT INFORMATION';


    section.appendChild(
        title
    );


    const grid =
        document.createElement(
            'div'
        );


    grid.className =
        'result-information-grid';


    addInformationItem(
        grid,
        'Student Name',
        student.fullName
    );


    addInformationItem(
        grid,
        'Admission No.',
        student.admissionNo
    );


    addInformationItem(
        grid,
        'Gender',
        student.gender
    );


    addInformationItem(
        grid,
        'Class',
        getResultClassName(result)
    );


    addInformationItem(
        grid,
        'Session',
        getResultSessionName(result)
    );


    addInformationItem(
        grid,
        'Term',
        result.term ||
        currentSelection.term
    );


    section.appendChild(
        grid
    );


    return section;

}


function addInformationItem(
    container,
    label,
    value
) {

    const item =
        document.createElement(
            'div'
        );


    item.className =
        'result-information-item';


    const labelElement =
        document.createElement(
            'span'
        );


    labelElement.className =
        'result-information-label';


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            'strong'
        );


    valueElement.className =
        'result-information-value';


    valueElement.textContent =
        safeDisplay(
            value
        );


    item.appendChild(
        labelElement
    );


    item.appendChild(
        valueElement
    );


    container.appendChild(
        item
    );

}


/* ============================================================
   PERFORMANCE SUMMARY
============================================================ */

function buildPerformanceSummary(
    summary,
    result
) {

    const section =
        document.createElement(
            'section'
        );


    section.className =
        'result-section';


    const title =
        document.createElement(
            'div'
        );


    title.className =
        'result-section-title';


    title.textContent =
        'PERFORMANCE SUMMARY';


    section.appendChild(
        title
    );


    const grid =
        document.createElement(
            'div'
        );


    grid.className =
        'result-performance-grid';


    addPerformanceItem(
        grid,
        'Total',
        summary.overallTotal ??
        summary.total ??
        result.total ??
        0
    );


    addPerformanceItem(
        grid,
        'Average',
        formatAverage(
            summary.average ??
            result.average
        )
    );


    addPerformanceItem(
        grid,
        'Position',
        formatPosition(
            summary.position ??
            result.position
        )
    );


    addPerformanceItem(
        grid,
        'Status',
        formatCompletionStatus(
            summary.completionStatus
        )
    );


    section.appendChild(
        grid
    );


    return section;

}


function addPerformanceItem(
    container,
    label,
    value
) {

    const item =
        document.createElement(
            'div'
        );


    item.className =
        'performance-item';


    const labelElement =
        document.createElement(
            'span'
        );


    labelElement.className =
        'performance-label';


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            'strong'
        );


    valueElement.className =
        'performance-value';


    valueElement.textContent =
        safeDisplay(
            value
        );


    item.appendChild(
        labelElement
    );


    item.appendChild(
        valueElement
    );


    container.appendChild(
        item
    );

}


/* ============================================================
   SUBJECT RESULTS
============================================================ */

function buildSubjectResults(
    subjects
) {

    const section =
        document.createElement(
            'section'
        );


    section.className =
        'result-section';


    const title =
        document.createElement(
            'div'
        );


    title.className =
        'result-section-title';


    title.textContent =
        'SUBJECT RESULTS';


    section.appendChild(
        title
    );


    if (!subjects.length) {

        const empty =
            document.createElement(
                'div'
            );


        empty.className =
            'result-empty';


        empty.textContent =
            'No subject results are available for this student.';


        section.appendChild(
            empty
        );


        return section;

    }


    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'result-subject-table-wrapper';


    const table =
        document.createElement(
            'table'
        );


    table.className =
        'result-subject-table';


    table.innerHTML = `
        <thead>
            <tr>
                <th>Subject</th>
                <th>Test</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Remark</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;


    const tbody =
        table.querySelector(
            'tbody'
        );


    subjects.forEach(
        function (subject) {

            const row =
                document.createElement(
                    'tr'
                );


            const subjectName =
                getSubjectValue(
                    subject,
                    [
                        'subjectName',
                        'Subject Name',
                        'subject'
                    ]
                );


            const test =
                getSubjectValue(
                    subject,
                    [
                        'testScore',
                        'Test Score',
                        'test'
                    ]
                );


            const exam =
                getSubjectValue(
                    subject,
                    [
                        'examScore',
                        'Exam Score',
                        'exam'
                    ]
                );


            const total =
                getSubjectValue(
                    subject,
                    [
                        'totalScore',
                        'Total Score',
                        'total'
                    ]
                );


            const grade =
                getSubjectValue(
                    subject,
                    [
                        'grade',
                        'Grade'
                    ]
                );


            const remark =
                getSubjectValue(
                    subject,
                    [
                        'remark',
                        'Remark'
                    ]
                );


            row.appendChild(
                createTableCell(
                    subjectName
                )
            );


            row.appendChild(
                createTableCell(
                    formatScore(test)
                )
            );


            row.appendChild(
                createTableCell(
                    formatScore(exam)
                )
            );


            row.appendChild(
                createTableCell(
                    formatScore(total)
                )
            );


            row.appendChild(
                createTableCell(
                    grade
                )
            );


            row.appendChild(
                createTableCell(
                    remark
                )
            );


            tbody.appendChild(
                row
            );

        }
    );


    wrapper.appendChild(
        table
    );


    section.appendChild(
        wrapper
    );


    return section;

}


/* ============================================================
   COMMENTS
============================================================ */

function buildCommentsSection(
    comments
) {

    const section =
        document.createElement(
            'section'
        );


    section.className =
        'result-section';


    const title =
        document.createElement(
            'div'
        );


    title.className =
        'result-section-title';


    title.textContent =
        'COMMENTS';


    section.appendChild(
        title
    );


    const teacherComment =
        comments.teacherComment ||
        comments['Teacher Comment'] ||
        '';


    const principalComment =
        comments.principalComment ||
        comments['Principal Comment'] ||
        '';


    const commentsGrid =
        document.createElement(
            'div'
        );


    commentsGrid.className =
        'result-comments-grid';


    commentsGrid.appendChild(
        createCommentBox(
            'Teacher Comment',
            teacherComment
        )
    );


    commentsGrid.appendChild(
        createCommentBox(
            'Principal Comment',
            principalComment
        )
    );


    section.appendChild(
        commentsGrid
    );


    return section;

}


function createCommentBox(
    label,
    value
) {

    const box =
        document.createElement(
            'div'
        );


    box.className =
        'result-comment-box';


    const heading =
        document.createElement(
            'strong'
        );


    heading.textContent =
        label;


    const text =
        document.createElement(
            'p'
        );


    text.textContent =
        safeDisplay(
            value,
            'No comment entered.'
        );


    box.appendChild(
        heading
    );


    box.appendChild(
        text
    );


    return box;

}


/* ============================================================
   RESULT HELPERS
============================================================ */

function getResultClassName(
    result
) {

    if (result.class) {

        if (
            typeof result.class ===
            'string'
        ) {

            return result.class;

        }


        return buildClassName(
            result.class
        );

    }


    if (result.className) {

        return result.className;

    }


    return '';

}


function getResultSessionName(
    result
) {

    if (result.session) {

        if (
            typeof result.session ===
            'string'
        ) {

            return result.session;

        }


        return (
            result.session.sessionName ||
            result.session['Session Name'] ||
            ''
        );

    }


    return (
        result.sessionName ||
        ''
    );

}


function getSubjectValue(
    subject,
    keys
) {

    for (
        let index = 0;
        index < keys.length;
        index++
    ) {

        const key =
            keys[index];


        if (
            subject[key] !==
                undefined &&
            subject[key] !==
                null
        ) {

            return subject[key];

        }

    }


    return '';

}


function createTableCell(
    value
) {

    const cell =
        document.createElement(
            'td'
        );


    cell.textContent =
        safeDisplay(
            value
        );


    return cell;

}


/* ============================================================
   FORMATTING
============================================================ */

function formatNumber(
    value
) {

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

        return safeDisplay(
            value,
            '0'
        );

    }


    return number.toString();

}


function formatScore(
    value
) {

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

        return safeDisplay(
            value,
            '—'
        );

    }


    return number.toString();

}


function formatAverage(
    value
) {

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

        return safeDisplay(
            value,
            '—'
        );

    }


    return number.toFixed(2);

}


function formatPosition(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === '' ||
        String(value).toLowerCase() ===
            'null'
    ) {

        return '—';

    }


    return String(value);

}


function formatCompletionStatus(
    value
) {

    const normalized =
        normalizeStatus(
            value
        );


    if (
        normalized ===
        'complete'
    ) {

        return 'Complete';

    }


    if (
        normalized ===
        'incomplete'
    ) {

        return 'Incomplete';

    }


    return 'Not Started';

}


function normalizeStatus(
    value
) {

    return String(
        value || ''
    )
        .trim()
        .toLowerCase()
        .replace(/_/g, ' ');

}


function safeDisplay(
    value,
    fallback
) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {

        return fallback !==
            undefined
            ? fallback
            : '—';

    }


    return String(value);

}


/* ============================================================
   HTML ESCAPING
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value || ''
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


/* ============================================================
   PAGE MESSAGE
============================================================ */

function showMessage(
    message
) {

    const container =
        document.getElementById(
            'pageMessage'
        );

    const text =
        document.getElementById(
            'messageText'
        );


    if (
        !container ||
        !text
    ) {

        return;

    }


    text.textContent =
        message || '';


    container.classList.remove(
        'hidden'
    );

}


function hideMessage() {

    const container =
        document.getElementById(
            'pageMessage'
        );


    if (!container) {

        return;

    }


    container.classList.add(
        'hidden'
    );

}


/* ============================================================
   SELECTION MESSAGE
============================================================ */

function showSelectionMessage(
    message
) {

    const container =
        document.getElementById(
            'selectionMessage'
        );

    const text =
        document.getElementById(
            'selectionMessageText'
        );


    if (
        !container ||
        !text
    ) {

        return;

    }


    text.textContent =
        message || '';


    container.classList.remove(
        'hidden'
    );

}


function hideSelectionMessage() {

    const container =
        document.getElementById(
            'selectionMessage'
        );


    if (!container) {

        return;

    }


    container.classList.add(
        'hidden'
    );

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
   API REQUEST
============================================================ */

async function apiRequest(
    action,
    data
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
                method: 'POST',

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


    const text =
        await response.text();


    let parsed;


    try {

        parsed =
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            'Invalid API response:',
            text
        );


        throw new Error(
            'The server returned an invalid response.'
        );

    }


    return parsed;

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
