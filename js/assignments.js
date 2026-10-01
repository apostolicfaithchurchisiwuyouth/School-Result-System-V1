/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: assignments.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Assignment management frontend.
 *
 * CONNECTS TO:
 * createAssignment
 * getAssignments
 * getTeacherAssignments
 * getClassAssignments
 * deactivateAssignment
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

let currentSession = null;

let assignments = [];

let sessions = [];

let teachers = [];

let classes = [];

let subjects = [];


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

const schoolNameElement =
    document.getElementById('schoolName');

const userNameElement =
    document.getElementById('userName');

const userRoleElement =
    document.getElementById('userRole');

const userInitialsElement =
    document.getElementById('userInitials');

const openCreateButton =
    document.getElementById('openCreateButton');

const assignmentModal =
    document.getElementById('assignmentModal');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const assignmentForm =
    document.getElementById('assignmentForm');

const sessionSelect =
    document.getElementById('sessionSelect');

const teacherSelect =
    document.getElementById('teacherSelect');

const classSelect =
    document.getElementById('classSelect');

const subjectSelect =
    document.getElementById('subjectSelect');

const saveButton =
    document.getElementById('saveButton');

const formError =
    document.getElementById('formError');

const tableWrapper =
    document.getElementById('tableWrapper');

const recordCount =
    document.getElementById('recordCount');

const activeAssignmentCount =
    document.getElementById('activeAssignmentCount');

const pageMessage =
    document.getElementById('pageMessage');

const messageText =
    document.getElementById('messageText');

const closeMessage =
    document.getElementById('closeMessage');


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initializePage
);


async function initializePage() {

    currentSession =
        getStoredSession();


    if (!currentSession) {

        redirectToLogin();

        return;
    }


    populateUserInterface();

    setupEventListeners();


    await loadSetupData();

    await loadAssignments();

}


/* ============================================================
   SESSION
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


        const session =
            JSON.parse(raw);


        if (!session) {
            return null;
        }


        return session;

    } catch (error) {

        console.error(
            'Unable to read session:',
            error
        );


        localStorage.removeItem(
            SESSION_KEY
        );


        return null;

    }

}


function redirectToLogin() {

    window.location.href =
        'index.html';

}


/* ============================================================
   USER INTERFACE
============================================================ */

function populateUserInterface() {

    const user =
        currentSession.user ||
        currentSession;


    const school =
        currentSession.school ||
        {};


    const name =
        user.fullName ||
        currentSession.fullName ||
        'User';


    const role =
        user.role ||
        currentSession.role ||
        '--';


    const schoolName =
        school.schoolName ||
        currentSession.schoolName ||
        'School Results System';


    userNameElement.textContent =
        name;


    userRoleElement.textContent =
        role;


    schoolNameElement.textContent =
        schoolName;


    userInitialsElement.textContent =
        getInitials(name);

}


function getInitials(name) {

    const cleaned =
        String(name || '')
            .trim();


    if (!cleaned) {
        return '--';
    }


    const parts =
        cleaned
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


/* ============================================================
   SCHOOL ID
============================================================ */

function getSchoolId() {

    const user =
        currentSession.user ||
        currentSession;


    const school =
        currentSession.school ||
        {};


    return (
        school.schoolId ||
        user.schoolId ||
        currentSession.schoolId ||
        ''
    );

}


/* ============================================================
   EVENTS
============================================================ */

function setupEventListeners() {

    if (menuButton) {

        menuButton.addEventListener(
            'click',
            openSidebar
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            'click',
            closeSidebar
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            handleLogout
        );

    }


    if (openCreateButton) {

        openCreateButton.addEventListener(
            'click',
            openCreateModal
        );

    }


    if (closeModalButton) {

        closeModalButton.addEventListener(
            'click',
            closeAssignmentModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            'click',
            closeAssignmentModal
        );

    }


    if (assignmentModal) {

        assignmentModal.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    assignmentModal
                ) {

                    closeAssignmentModal();

                }

            }
        );

    }


    if (assignmentForm) {

        assignmentForm.addEventListener(
            'submit',
            handleAssignmentSubmit
        );

    }


    if (closeMessage) {

        closeMessage.addEventListener(
            'click',
            hideMessage
        );

    }


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape'
            ) {

                closeSidebar();

                closeAssignmentModal();

            }

        }
    );

}


/* ============================================================
   SIDEBAR
============================================================ */

function openSidebar() {

    sidebar.classList.add(
        'open'
    );


    sidebarOverlay.classList.add(
        'visible'
    );

}


function closeSidebar() {

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

function handleLogout() {

    localStorage.removeItem(
        SESSION_KEY
    );


    window.location.href =
        'index.html';

}


/* ============================================================
   LOAD SETUP DATA
============================================================ */

async function loadSetupData() {

    try {

        const schoolId =
            getSchoolId();


        if (!schoolId) {

            throw new Error(
                'Your school session is missing. Please log in again.'
            );

        }


        const [
            sessionsResult,
            teachersResult,
            classesResult,
            subjectsResult
        ] = await Promise.all([

            callApi(
                'getSessions',
                {
                    schoolId:
                        schoolId
                }
            ),

            callApi(
                'getActiveTeachers',
                {
                    schoolId:
                        schoolId
                }
            ),

            callApi(
                'getActiveClasses',
                {
                    schoolId:
                        schoolId
                }
            ),

            callApi(
                'getActiveSubjects',
                {
                    schoolId:
                        schoolId
                }
            )

        ]);


        sessions =
            extractRecords(
                sessionsResult,
                'sessions'
            );


        teachers =
            extractRecords(
                teachersResult,
                'teachers'
            );


        classes =
            extractRecords(
                classesResult,
                'classes'
            );


        subjects =
            extractRecords(
                subjectsResult,
                'subjects'
            );


        populateSelects();


    } catch (error) {

        console.error(
            'Setup data error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to load assignment setup data.',
            'error'
        );

    }

}


/* ============================================================
   POPULATE SELECTS
============================================================ */

function populateSelects() {

    populateSessionSelect();

    populateTeacherSelect();

    populateClassSelect();

    populateSubjectSelect();

}


/* ============================================================
   SESSION SELECT
============================================================ */

function populateSessionSelect() {

    sessionSelect.innerHTML = `
        <option value="">
            Select session
        </option>
    `;


    const sorted =
        [...sessions].sort(
            (a, b) => {

                const aStatus =
                    normalizeStatus(a);

                const bStatus =
                    normalizeStatus(b);


                if (
                    aStatus === 'Active' &&
                    bStatus !== 'Active'
                ) {

                    return -1;

                }


                if (
                    aStatus !== 'Active' &&
                    bStatus === 'Active'
                ) {

                    return 1;

                }


                return getSessionName(a)
                    .localeCompare(
                        getSessionName(b)
                    );

            }
        );


    sorted.forEach(
        session => {

            const id =
                getSessionId(session);


            if (!id) {
                return;
            }


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                id;


            option.textContent =
                getSessionName(session) ||
                'Unnamed Session';


            if (
                normalizeStatus(session) !==
                'Active'
            ) {

                option.textContent +=
                    ' (Inactive)';

            }


            sessionSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   TEACHER SELECT
============================================================ */

function populateTeacherSelect() {

    teacherSelect.innerHTML = `
        <option value="">
            Select teacher
        </option>
    `;


    const sorted =
        [...teachers].sort(
            (a, b) =>
                getTeacherName(a)
                    .localeCompare(
                        getTeacherName(b)
                    )
        );


    sorted.forEach(
        teacher => {

            const id =
                getTeacherId(teacher);


            if (!id) {
                return;
            }


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                id;


            option.textContent =
                getTeacherName(teacher) ||
                'Unnamed Teacher';


            teacherSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   CLASS SELECT
============================================================ */

function populateClassSelect() {

    classSelect.innerHTML = `
        <option value="">
            Select class
        </option>
    `;


    const sorted =
        [...classes].sort(
            (a, b) =>
                getClassDisplayName(a)
                    .localeCompare(
                        getClassDisplayName(b)
                    )
        );


    sorted.forEach(
        schoolClass => {

            const id =
                getClassId(
                    schoolClass
                );


            if (!id) {
                return;
            }


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                id;


            option.textContent =
                getClassDisplayName(
                    schoolClass
                );


            classSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   SUBJECT SELECT
============================================================ */

function populateSubjectSelect() {

    subjectSelect.innerHTML = `
        <option value="">
            Select subject
        </option>
    `;


    const sorted =
        [...subjects].sort(
            (a, b) =>
                getSubjectName(a)
                    .localeCompare(
                        getSubjectName(b)
                    )
        );


    sorted.forEach(
        subject => {

            const id =
                getSubjectId(
                    subject
                );


            if (!id) {
                return;
            }


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                id;


            option.textContent =
                getSubjectDisplayName(
                    subject
                );


            subjectSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   LOAD ASSIGNMENTS
============================================================ */

async function loadAssignments() {

    showLoading();


    try {

        const schoolId =
            getSchoolId();


        if (!schoolId) {

            throw new Error(
                'Your school session is missing. Please log in again.'
            );

        }


        const result =
            await callApi(
                'getAssignments',
                {
                    schoolId:
                        schoolId
                }
            );


        assignments =
            extractRecords(
                result,
                'assignments'
            );


        renderAssignments();


    } catch (error) {

        console.error(
            'Load assignments error:',
            error
        );


        showTableError(
            error.message ||
            'Unable to load assignments.'
        );


        showMessage(
            error.message ||
            'Unable to load assignments.',
            'error'
        );

    }

}


/* ============================================================
   API
============================================================ */

async function callApi(
    action,
    data = {}
) {

    const payload = {

        action:
            action,

        ...data

    };


    console.log(
        `API request [${action}]`,
        payload
    );


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
                        JSON.stringify(
                            payload
                        )
                }
            );

    } catch (networkError) {

        throw new Error(
            'Unable to connect to the server. Please check your internet connection.'
        );

    }


    const responseText =
        await response.text();


    console.log(
        `API response [${action}]`,
        responseText
    );


    let result;


    try {

        result =
            JSON.parse(
                responseText
            );

    } catch (parseError) {

        console.error(
            'Invalid API response:',
            responseText
        );


        throw new Error(
            'The server returned an invalid response.'
        );

    }


    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.error ||
            result.message ||
            'Request failed.'
        );

    }


    return result;

}


/* ============================================================
   RESPONSE HELPERS
============================================================ */

function extractRecords(
    result,
    propertyName
) {

    if (!result) {
        return [];
    }


    if (Array.isArray(result)) {
        return result;
    }


    if (
        propertyName &&
        Array.isArray(
            result[propertyName]
        )
    ) {

        return result[propertyName];

    }


    if (
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }


    if (
        propertyName &&
        result.data &&
        Array.isArray(
            result.data[propertyName]
        )
    ) {

        return result.data[propertyName];

    }


    return [];

}


/* ============================================================
   RENDER ASSIGNMENTS
============================================================ */

function renderAssignments() {

    const total =
        assignments.length;


    const active =
        assignments.filter(
            item =>
                normalizeStatus(
                    item
                ) === 'Active'
        ).length;


    recordCount.textContent =
        `${total} ${
            total === 1
                ? 'assignment'
                : 'assignments'
        }`;


    activeAssignmentCount.textContent =
        active;


    if (!total) {

        showEmptyState();

        return;

    }


    const rows =
        assignments
            .map(
                (assignment, index) =>
                    renderAssignmentRow(
                        assignment,
                        index
                    )
            )
            .join('');


    tableWrapper.innerHTML = `

        <table class="assignments-table">

            <thead>

                <tr>

                    <th>
                        #
                    </th>

                    <th>
                        TEACHER
                    </th>

                    <th>
                        CLASS
                    </th>

                    <th>
                        SUBJECT
                    </th>

                    <th>
                        SESSION
                    </th>

                    <th>
                        STATUS
                    </th>

                    <th>
                        ACTIONS
                    </th>

                </tr>

            </thead>

            <tbody>
                ${rows}
            </tbody>

        </table>

    `;


    attachAssignmentActions();

}


/* ============================================================
   ASSIGNMENT ROW
============================================================ */

function renderAssignmentRow(
    assignment,
    index
) {

    const id =
        getAssignmentId(
            assignment
        );


    const teacher =
        escapeHtml(
            getAssignmentTeacherName(
                assignment
            )
        );


    const schoolClass =
        escapeHtml(
            getAssignmentClassName(
                assignment
            )
        );


    const subject =
        escapeHtml(
            getAssignmentSubjectName(
                assignment
            )
        );


    const session =
        escapeHtml(
            getAssignmentSessionName(
                assignment
            )
        );


    const status =
        normalizeStatus(
            assignment
        );


    const statusClass =
        status.toLowerCase();


    const actionHtml =
        status === 'Active'
            ? `
                <div class="action-group">

                    <button
                        type="button"
                        class="deactivate-button"
                        data-action="deactivate"
                        data-id="${escapeAttribute(id)}"
                    >
                        Deactivate
                    </button>

                </div>
            `
            : `
                <span class="secondary-cell">
                    —
                </span>
            `;


    return `

        <tr>

            <td>
                ${index + 1}
            </td>

            <td class="primary-cell">
                ${teacher}
            </td>

            <td class="secondary-cell">
                ${schoolClass}
            </td>

            <td class="secondary-cell">
                ${subject}
            </td>

            <td class="secondary-cell">
                ${session}
            </td>

            <td>

                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(status)}
                </span>

            </td>

            <td>
                ${actionHtml}
            </td>

        </tr>

    `;

}


/* ============================================================
   ASSIGNMENT ACTIONS
============================================================ */

function attachAssignmentActions() {

    const buttons =
        tableWrapper.querySelectorAll(
            '[data-action]'
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                'click',
                handleAssignmentAction
            );

        }
    );

}


async function handleAssignmentAction(
    event
) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const assignmentId =
        button.dataset.id;


    if (!assignmentId) {

        showMessage(
            'The selected assignment could not be identified.',
            'error'
        );

        return;
    }


    if (
        action ===
        'deactivate'
    ) {

        await deactivateAssignment(
            assignmentId
        );

    }

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    assignmentForm.reset();

    hideFormError();


    saveButton.textContent =
        'Create Assignment';


    saveButton.disabled =
        false;


    assignmentModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => sessionSelect.focus(),
        50
    );

}


/* ============================================================
   CLOSE MODAL
============================================================ */

function closeAssignmentModal() {

    assignmentModal.classList.add(
        'hidden'
    );


    assignmentForm.reset();

    hideFormError();

}


/* ============================================================
   SUBMIT
============================================================ */

async function handleAssignmentSubmit(
    event
) {

    event.preventDefault();


    hideFormError();


    const schoolId =
        getSchoolId();


    const sessionId =
        sessionSelect.value;


    const teacherId =
        teacherSelect.value;


    const classId =
        classSelect.value;


    const subjectId =
        subjectSelect.value;


    if (!schoolId) {

        showFormError(
            'Your school session is missing. Please log in again.'
        );

        return;
    }


    if (!sessionId) {

        showFormError(
            'Please select an academic session.'
        );

        sessionSelect.focus();

        return;
    }


    if (!teacherId) {

        showFormError(
            'Please select a teacher.'
        );

        teacherSelect.focus();

        return;
    }


    if (!classId) {

        showFormError(
            'Please select a class.'
        );

        classSelect.focus();

        return;
    }


    if (!subjectId) {

        showFormError(
            'Please select a subject.'
        );

        subjectSelect.focus();

        return;
    }


    setSavingState(
        true
    );


    try {

        const result =
            await callApi(
                'createAssignment',
                {
                    schoolId:
                        schoolId,

                    teacherId:
                        teacherId,

                    classId:
                        classId,

                    subjectId:
                        subjectId,

                    sessionId:
                        sessionId,

                    status:
                        'Active'
                }
            );


        console.log(
            'Create assignment result:',
            result
        );


        closeAssignmentModal();


        showMessage(
            'Assignment created successfully.',
            'success'
        );


        await loadAssignments();


    } catch (error) {

        console.error(
            'Create assignment error:',
            error
        );


        showFormError(
            error.message ||
            'Unable to create assignment.'
        );

    } finally {

        setSavingState(
            false
        );

    }

}


/* ============================================================
   DEACTIVATE
============================================================ */

async function deactivateAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            item =>
                getAssignmentId(item) ===
                assignmentId
        );


    if (!assignment) {

        showMessage(
            'The selected assignment could not be found.',
            'error'
        );

        return;
    }


    const description =
        [
            getAssignmentTeacherName(
                assignment
            ),
            getAssignmentClassName(
                assignment
            ),
            getAssignmentSubjectName(
                assignment
            )
        ]
            .filter(Boolean)
            .join(' — ');


    const confirmed =
        window.confirm(
            `Deactivate this assignment?\n\n${description}\n\nThe assignment will no longer be available for new score-entry work. Existing records will not be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Deactivating assignment...',
            'success'
        );


        await callApi(
            'deactivateAssignment',
            {
                schoolId:
                    getSchoolId(),

                assignmentId:
                    assignmentId
            }
        );


        showMessage(
            'Assignment deactivated successfully.',
            'success'
        );


        await loadAssignments();


    } catch (error) {

        console.error(
            'Deactivate assignment error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to deactivate assignment.',
            'error'
        );

    }

}


/* ============================================================
   SAVING STATE
============================================================ */

function setSavingState(
    saving
) {

    saveButton.disabled =
        saving;


    saveButton.textContent =
        saving
            ? 'Creating...'
            : 'Create Assignment';

}


/* ============================================================
   FORM ERROR
============================================================ */

function showFormError(
    message
) {

    formError.textContent =
        message;


    formError.classList.remove(
        'hidden'
    );

}


function hideFormError() {

    formError.textContent =
        '';


    formError.classList.add(
        'hidden'
    );

}


/* ============================================================
   TABLE STATES
============================================================ */

function showLoading() {

    tableWrapper.innerHTML = `

        <div class="loading-state">

            <div class="spinner"></div>

            <span>
                Loading assignments...
            </span>

        </div>

    `;

}


function showEmptyState() {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No assignments yet
            </strong>

            <span>
                Create an assignment to connect a teacher,
                class, subject and academic session.
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
                Unable to load assignments
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;

}


/* ============================================================
   MESSAGE
============================================================ */

function showMessage(
    message,
    type = 'success'
) {

    messageText.textContent =
        message;


    pageMessage.className =
        `page-message ${type}`;


    pageMessage.classList.remove(
        'hidden'
    );

}


function hideMessage() {

    pageMessage.classList.add(
        'hidden'
    );

}


/* ============================================================
   ASSIGNMENT FIELD HELPERS
============================================================ */

function getAssignmentId(
    assignment
) {

    return String(
        assignment['Assignment ID'] ||
        assignment.assignmentId ||
        assignment.id ||
        ''
    ).trim();

}


function getAssignmentTeacherId(
    assignment
) {

    return String(
        assignment['Teacher ID'] ||
        assignment.teacherId ||
        ''
    ).trim();

}


function getAssignmentClassId(
    assignment
) {

    return String(
        assignment['Class ID'] ||
        assignment.classId ||
        ''
    ).trim();

}


function getAssignmentSubjectId(
    assignment
) {

    return String(
        assignment['Subject ID'] ||
        assignment.subjectId ||
        ''
    ).trim();

}


function getAssignmentSessionId(
    assignment
) {

    return String(
        assignment['Session ID'] ||
        assignment.sessionId ||
        ''
    ).trim();

}


function getAssignmentTeacherName(
    assignment
) {

    const direct =
        assignment['Teacher Name'] ||
        assignment.teacherName;


    if (direct) {
        return String(direct).trim();
    }


    const teacherId =
        getAssignmentTeacherId(
            assignment
        );


    const teacher =
        teachers.find(
            item =>
                getTeacherId(item) ===
                teacherId
        );


    return teacher
        ? getTeacherName(teacher)
        : 'Unknown Teacher';

}


function getAssignmentClassName(
    assignment
) {

    const direct =
        assignment['Class Name'] ||
        assignment.className;


    if (direct) {
        return String(direct).trim();
    }


    const classId =
        getAssignmentClassId(
            assignment
        );


    const schoolClass =
        classes.find(
            item =>
                getClassId(item) ===
                classId
        );


    return schoolClass
        ? getClassDisplayName(schoolClass)
        : 'Unknown Class';

}


function getAssignmentSubjectName(
    assignment
) {

    const direct =
        assignment['Subject Name'] ||
        assignment.subjectName;


    if (direct) {
        return String(direct).trim();
    }


    const subjectId =
        getAssignmentSubjectId(
            assignment
        );


    const subject =
        subjects.find(
            item =>
                getSubjectId(item) ===
                subjectId
        );


    return subject
        ? getSubjectDisplayName(subject)
        : 'Unknown Subject';

}


function getAssignmentSessionName(
    assignment
) {

    const direct =
        assignment['Session Name'] ||
        assignment.sessionName;


    if (direct) {
        return String(direct).trim();
    }


    const sessionId =
        getAssignmentSessionId(
            assignment
        );


    const session =
        sessions.find(
            item =>
                getSessionId(item) ===
                sessionId
        );


    return session
        ? getSessionName(session)
        : 'Unknown Session';

}


/* ============================================================
   SESSION HELPERS
============================================================ */

function getSessionId(
    session
) {

    return String(
        session['Session ID'] ||
        session.sessionId ||
        session.id ||
        ''
    ).trim();

}


function getSessionName(
    session
) {

    return String(
        session['Session Name'] ||
        session.sessionName ||
        ''
    ).trim();

}


/* ============================================================
   TEACHER HELPERS
============================================================ */

function getTeacherId(
    teacher
) {

    return String(
        teacher['Teacher ID'] ||
        teacher.teacherId ||
        teacher.id ||
        ''
    ).trim();

}


function getTeacherName(
    teacher
) {

    return String(
        teacher['Full Name'] ||
        teacher.fullName ||
        ''
    ).trim();

}


/* ============================================================
   CLASS HELPERS
============================================================ */

function getClassId(
    schoolClass
) {

    return String(
        schoolClass['Class ID'] ||
        schoolClass.classId ||
        schoolClass.id ||
        ''
    ).trim();

}


function getClassDisplayName(
    schoolClass
) {

    const name =
        String(
            schoolClass['Class Name'] ||
            schoolClass.className ||
            ''
        ).trim();


    const section =
        String(
            schoolClass['Section'] ||
            schoolClass.section ||
            ''
        ).trim();


    if (
        name &&
        section
    ) {

        return `${name} — ${section}`;

    }


    return name || 'Unnamed Class';

}


/* ============================================================
   SUBJECT HELPERS
============================================================ */

function getSubjectId(
    subject
) {

    return String(
        subject['Subject ID'] ||
        subject.subjectId ||
        subject.id ||
        ''
    ).trim();

}


function getSubjectName(
    subject
) {

    return String(
        subject['Subject Name'] ||
        subject.subjectName ||
        ''
    ).trim();

}


function getSubjectDisplayName(
    subject
) {

    const name =
        getSubjectName(
            subject
        );


    const code =
        String(
            subject['Subject Code'] ||
            subject.subjectCode ||
            ''
        ).trim();


    if (
        name &&
        code
    ) {

        return `${name} (${code})`;

    }


    return name || 'Unnamed Subject';

}


/* ============================================================
   STATUS
============================================================ */

function normalizeStatus(
    item
) {

    const raw =
        String(
            item['Status'] ||
            item.status ||
            'Inactive'
        ).trim();


    if (
        raw.toLowerCase() ===
        'active'
    ) {

        return 'Active';

    }


    return 'Inactive';

}


/* ============================================================
   HTML SAFETY
============================================================ */

function escapeHtml(
    value
) {

    return String(value || '')
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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}
