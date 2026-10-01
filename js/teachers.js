/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: teachers.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Teachers management frontend.
 *
 * CONNECTS TO:
 * createTeacher
 * getTeachers
 * getActiveTeachers
 * updateTeacher
 * deactivateTeacher
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

let teachers = [];

let editingTeacherId = null;


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

const teacherModal =
    document.getElementById('teacherModal');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const teacherForm =
    document.getElementById('teacherForm');

const teacherNameInput =
    document.getElementById('teacherName');

const teacherPhoneInput =
    document.getElementById('teacherPhone');

const teacherEmailInput =
    document.getElementById('teacherEmail');

const saveButton =
    document.getElementById('saveButton');

const modalTitle =
    document.getElementById('modalTitle');

const formError =
    document.getElementById('formError');

const tableWrapper =
    document.getElementById('tableWrapper');

const recordCount =
    document.getElementById('recordCount');

const activeTeacherCount =
    document.getElementById('activeTeacherCount');

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

    await loadTeachers();

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
            closeTeacherModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            'click',
            closeTeacherModal
        );

    }


    if (teacherModal) {

        teacherModal.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    teacherModal
                ) {

                    closeTeacherModal();

                }

            }
        );

    }


    if (teacherForm) {

        teacherForm.addEventListener(
            'submit',
            handleTeacherSubmit
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

                closeTeacherModal();

            }

        }
    );

}


/* ============================================================
   MOBILE SIDEBAR
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
   LOAD TEACHERS
============================================================ */

async function loadTeachers() {

    showLoading();

    hideMessage();


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
                'getTeachers',
                {
                    schoolId:
                        schoolId
                }
            );


        teachers =
            extractRecords(
                result
            );


        renderTeachers();

    } catch (error) {

        console.error(
            'Load teachers error:',
            error
        );


        showTableError(
            error.message ||
            'Unable to load teachers.'
        );


        showMessage(
            error.message ||
            'Unable to load teachers.',
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

function extractRecords(result) {

    if (!result) {
        return [];
    }


    if (Array.isArray(result)) {
        return result;
    }


    if (
        Array.isArray(
            result.teachers
        )
    ) {

        return result.teachers;

    }


    if (
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }


    if (
        result.data &&
        Array.isArray(
            result.data.teachers
        )
    ) {

        return result.data.teachers;

    }


    return [];

}


/* ============================================================
   RENDER
============================================================ */

function renderTeachers() {

    const total =
        teachers.length;


    const active =
        teachers.filter(
            item =>
                normalizeStatus(
                    item
                ) === 'Active'
        ).length;


    recordCount.textContent =
        `${total} ${
            total === 1
                ? 'teacher'
                : 'teachers'
        }`;


    activeTeacherCount.textContent =
        active;


    if (!total) {

        showEmptyState();

        return;
    }


    const rows =
        teachers
            .map(
                (teacher, index) =>
                    renderTeacherRow(
                        teacher,
                        index
                    )
            )
            .join('');


    tableWrapper.innerHTML = `

        <table class="teachers-table">

            <thead>

                <tr>

                    <th>
                        #
                    </th>

                    <th>
                        TEACHER
                    </th>

                    <th>
                        PHONE
                    </th>

                    <th>
                        EMAIL
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


    attachTeacherActions();

}


/* ============================================================
   TEACHER ROW
============================================================ */

function renderTeacherRow(
    teacher,
    index
) {

    const id =
        getTeacherId(
            teacher
        );


    const name =
        escapeHtml(
            getTeacherName(
                teacher
            )
        );


    const phoneValue =
        getTeacherPhone(
            teacher
        );


    const emailValue =
        getTeacherEmail(
            teacher
        );


    const phone =
        phoneValue
            ? escapeHtml(phoneValue)
            : '<span class="muted-value">—</span>';


    const email =
        emailValue
            ? escapeHtml(emailValue)
            : '<span class="muted-value">—</span>';


    const status =
        normalizeStatus(
            teacher
        );


    const statusClass =
        status.toLowerCase();


    const actionHtml =
        status === 'Active'
            ? `
                <div class="action-group">

                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${escapeAttribute(id)}"
                    >
                        Edit
                    </button>

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
                <div class="action-group">

                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${escapeAttribute(id)}"
                    >
                        Edit
                    </button>

                </div>
            `;


    return `

        <tr>

            <td>
                ${index + 1}
            </td>

            <td class="teacher-name-cell">
                ${name}
            </td>

            <td class="contact-cell">
                ${phone}
            </td>

            <td class="contact-cell">
                ${email}
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
   ACTIONS
============================================================ */

function attachTeacherActions() {

    const buttons =
        tableWrapper.querySelectorAll(
            '[data-action]'
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                'click',
                handleTeacherAction
            );

        }
    );

}


async function handleTeacherAction(
    event
) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const teacherId =
        button.dataset.id;


    if (!teacherId) {

        showMessage(
            'The selected teacher could not be identified.',
            'error'
        );

        return;
    }


    if (action === 'edit') {

        openEditModal(
            teacherId
        );

        return;
    }


    if (action === 'deactivate') {

        await deactivateTeacher(
            teacherId
        );

    }

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    editingTeacherId =
        null;


    modalTitle.textContent =
        'Create Teacher';


    saveButton.textContent =
        'Create Teacher';


    teacherForm.reset();

    hideFormError();


    teacherModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => teacherNameInput.focus(),
        50
    );

}


/* ============================================================
   EDIT MODAL
============================================================ */

function openEditModal(
    teacherId
) {

    const teacher =
        teachers.find(
            item =>
                getTeacherId(item) ===
                teacherId
        );


    if (!teacher) {

        showMessage(
            'The selected teacher could not be found.',
            'error'
        );

        return;
    }


    editingTeacherId =
        teacherId;


    modalTitle.textContent =
        'Edit Teacher';


    saveButton.textContent =
        'Save Changes';


    teacherNameInput.value =
        getTeacherName(
            teacher
        );


    teacherPhoneInput.value =
        getTeacherPhone(
            teacher
        );


    teacherEmailInput.value =
        getTeacherEmail(
            teacher
        );


    hideFormError();


    teacherModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => teacherNameInput.focus(),
        50
    );

}


/* ============================================================
   CLOSE MODAL
============================================================ */

function closeTeacherModal() {

    teacherModal.classList.add(
        'hidden'
    );


    editingTeacherId =
        null;


    teacherForm.reset();

    hideFormError();

}


/* ============================================================
   FORM SUBMIT
============================================================ */

async function handleTeacherSubmit(
    event
) {

    event.preventDefault();


    hideFormError();


    const fullName =
        teacherNameInput.value.trim();


    const phone =
        teacherPhoneInput.value.trim();


    const email =
        teacherEmailInput.value.trim();


    if (!fullName) {

        showFormError(
            'Please enter the teacher\'s full name.'
        );

        teacherNameInput.focus();

        return;
    }


    if (
        email &&
        !isValidEmail(email)
    ) {

        showFormError(
            'Please enter a valid email address.'
        );

        teacherEmailInput.focus();

        return;
    }


    const schoolId =
        getSchoolId();


    if (!schoolId) {

        showFormError(
            'Your school session is missing. Please log in again.'
        );

        return;
    }


    setSavingState(
        true
    );


    try {

        let result;


        if (editingTeacherId) {

            result =
                await callApi(
                    'updateTeacher',
                    {
                        schoolId:
                            schoolId,

                        teacherId:
                            editingTeacherId,

                        fullName:
                            fullName,

                        phone:
                            phone,

                        email:
                            email
                    }
                );

        } else {

            result =
                await callApi(
                    'createTeacher',
                    {
                        schoolId:
                            schoolId,

                        fullName:
                            fullName,

                        phone:
                            phone,

                        email:
                            email,

                        status:
                            'Active'
                    }
                );

        }


        console.log(
            'Teacher save result:',
            result
        );


        const wasEditing =
            Boolean(
                editingTeacherId
            );


        closeTeacherModal();


        showMessage(
            wasEditing
                ? 'Teacher updated successfully.'
                : 'Teacher created successfully.',
            'success'
        );


        await loadTeachers();

    } catch (error) {

        console.error(
            'Save teacher error:',
            error
        );


        showFormError(
            error.message ||
            'Unable to save teacher.'
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

async function deactivateTeacher(
    teacherId
) {

    const teacher =
        teachers.find(
            item =>
                getTeacherId(item) ===
                teacherId
        );


    if (!teacher) {

        showMessage(
            'The selected teacher could not be found.',
            'error'
        );

        return;
    }


    const teacherName =
        getTeacherName(
            teacher
        );


    const confirmed =
        window.confirm(
            `Deactivate "${teacherName}"?\n\nThe teacher will no longer be available for new assignments. Existing records will not be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Deactivating teacher...',
            'success'
        );


        await callApi(
            'deactivateTeacher',
            {
                schoolId:
                    getSchoolId(),

                teacherId:
                    teacherId
            }
        );


        showMessage(
            'Teacher deactivated successfully.',
            'success'
        );


        await loadTeachers();

    } catch (error) {

        console.error(
            'Deactivate teacher error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to deactivate teacher.',
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

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        saving;


    if (saving) {

        saveButton.textContent =
            editingTeacherId
                ? 'Saving...'
                : 'Creating...';

    } else {

        saveButton.textContent =
            editingTeacherId
                ? 'Save Changes'
                : 'Create Teacher';

    }

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
                Loading teachers...
            </span>

        </div>

    `;

}


function showEmptyState() {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No teachers yet
            </strong>

            <span>
                Create your first teacher to begin
                assigning teachers to classes and subjects.
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
                Unable to load teachers
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


function getTeacherPhone(
    teacher
) {

    return String(
        teacher['Phone'] ||
        teacher.phone ||
        ''
    ).trim();

}


function getTeacherEmail(
    teacher
) {

    return String(
        teacher['Email'] ||
        teacher.email ||
        ''
    ).trim();

}


function normalizeStatus(
    teacher
) {

    const raw =
        String(
            teacher['Status'] ||
            teacher.status ||
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
   VALIDATION
============================================================ */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

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
