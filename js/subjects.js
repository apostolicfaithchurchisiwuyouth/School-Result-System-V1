/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: subjects.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Subjects management frontend.
 *
 * CONNECTS TO:
 * createSubject
 * getSubjects
 * getActiveSubjects
 * updateSubject
 * deactivateSubject
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

let subjects = [];

let editingSubjectId = null;


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

const subjectModal =
    document.getElementById('subjectModal');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const subjectForm =
    document.getElementById('subjectForm');

const subjectNameInput =
    document.getElementById('subjectName');

const subjectCodeInput =
    document.getElementById('subjectCode');

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

const activeSubjectCount =
    document.getElementById('activeSubjectCount');

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

    await loadSubjects();
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
   EVENT LISTENERS
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
            closeSubjectModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            'click',
            closeSubjectModal
        );

    }


    if (subjectModal) {

        subjectModal.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    subjectModal
                ) {

                    closeSubjectModal();

                }

            }
        );

    }


    if (subjectForm) {

        subjectForm.addEventListener(
            'submit',
            handleSubjectSubmit
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

                closeSubjectModal();

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
   LOAD SUBJECTS
============================================================ */

async function loadSubjects() {

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
                'getSubjects',
                {
                    schoolId:
                        schoolId
                }
            );


        subjects =
            extractRecords(result);


        renderSubjects();

    } catch (error) {

        console.error(
            'Load subjects error:',
            error
        );


        showTableError(
            error.message ||
            'Unable to load subjects.'
        );


        showMessage(
            error.message ||
            'Unable to load subjects.',
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
            result.subjects
        )
    ) {

        return result.subjects;

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
            result.data.subjects
        )
    ) {

        return result.data.subjects;

    }


    return [];

}


/* ============================================================
   RENDER SUBJECTS
============================================================ */

function renderSubjects() {

    const total =
        subjects.length;


    const active =
        subjects.filter(
            item =>
                normalizeStatus(
                    item
                ) === 'Active'
        ).length;


    recordCount.textContent =
        `${total} ${
            total === 1
                ? 'subject'
                : 'subjects'
        }`;


    activeSubjectCount.textContent =
        active;


    if (!total) {

        showEmptyState();

        return;
    }


    const rows =
        subjects
            .map(
                (subject, index) =>
                    renderSubjectRow(
                        subject,
                        index
                    )
            )
            .join('');


    tableWrapper.innerHTML = `

        <table class="subjects-table">

            <thead>

                <tr>

                    <th>
                        #
                    </th>

                    <th>
                        SUBJECT
                    </th>

                    <th>
                        CODE
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


    attachSubjectActions();

}


/* ============================================================
   RENDER SUBJECT ROW
============================================================ */

function renderSubjectRow(
    subject,
    index
) {

    const id =
        getSubjectId(
            subject
        );


    const name =
        escapeHtml(
            getSubjectName(
                subject
            )
        );


    const codeValue =
        getSubjectCode(
            subject
        );


    const code =
        codeValue
            ? escapeHtml(codeValue)
            : '<span class="muted-value">—</span>';


    const status =
        normalizeStatus(
            subject
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

            <td class="subject-name-cell">
                ${name}
            </td>

            <td class="subject-code-cell">
                ${code}
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
   SUBJECT ACTIONS
============================================================ */

function attachSubjectActions() {

    const buttons =
        tableWrapper.querySelectorAll(
            '[data-action]'
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                'click',
                handleSubjectAction
            );

        }
    );

}


async function handleSubjectAction(
    event
) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const subjectId =
        button.dataset.id;


    if (!subjectId) {

        showMessage(
            'The selected subject could not be identified.',
            'error'
        );

        return;
    }


    if (action === 'edit') {

        openEditModal(
            subjectId
        );

        return;
    }


    if (action === 'deactivate') {

        await deactivateSubject(
            subjectId
        );

    }

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    editingSubjectId =
        null;


    modalTitle.textContent =
        'Create Subject';


    saveButton.textContent =
        'Create Subject';


    subjectForm.reset();

    hideFormError();


    subjectModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => subjectNameInput.focus(),
        50
    );

}


/* ============================================================
   EDIT MODAL
============================================================ */

function openEditModal(
    subjectId
) {

    const subject =
        subjects.find(
            item =>
                getSubjectId(item) ===
                subjectId
        );


    if (!subject) {

        showMessage(
            'The selected subject could not be found.',
            'error'
        );

        return;
    }


    editingSubjectId =
        subjectId;


    modalTitle.textContent =
        'Edit Subject';


    saveButton.textContent =
        'Save Changes';


    subjectNameInput.value =
        getSubjectName(
            subject
        );


    subjectCodeInput.value =
        getSubjectCode(
            subject
        );


    hideFormError();


    subjectModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => subjectNameInput.focus(),
        50
    );

}


/* ============================================================
   CLOSE MODAL
============================================================ */

function closeSubjectModal() {

    subjectModal.classList.add(
        'hidden'
    );


    editingSubjectId =
        null;


    subjectForm.reset();

    hideFormError();

}


/* ============================================================
   FORM SUBMISSION
============================================================ */

async function handleSubjectSubmit(
    event
) {

    event.preventDefault();


    hideFormError();


    const subjectName =
        subjectNameInput.value.trim();


    const subjectCode =
        subjectCodeInput.value.trim();


    if (!subjectName) {

        showFormError(
            'Please enter a subject name.'
        );

        subjectNameInput.focus();

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


        if (editingSubjectId) {

            result =
                await callApi(
                    'updateSubject',
                    {
                        schoolId:
                            schoolId,

                        subjectId:
                            editingSubjectId,

                        subjectName:
                            subjectName,

                        subjectCode:
                            subjectCode
                    }
                );

        } else {

            result =
                await callApi(
                    'createSubject',
                    {
                        schoolId:
                            schoolId,

                        subjectName:
                            subjectName,

                        subjectCode:
                            subjectCode,

                        status:
                            'Active'
                    }
                );

        }


        console.log(
            'Subject save result:',
            result
        );


        const wasEditing =
            Boolean(
                editingSubjectId
            );


        closeSubjectModal();


        showMessage(
            wasEditing
                ? 'Subject updated successfully.'
                : 'Subject created successfully.',
            'success'
        );


        await loadSubjects();

    } catch (error) {

        console.error(
            'Save subject error:',
            error
        );


        showFormError(
            error.message ||
            'Unable to save subject.'
        );

    } finally {

        setSavingState(
            false
        );

    }

}


/* ============================================================
   DEACTIVATE SUBJECT
============================================================ */

async function deactivateSubject(
    subjectId
) {

    const subject =
        subjects.find(
            item =>
                getSubjectId(item) ===
                subjectId
        );


    if (!subject) {

        showMessage(
            'The selected subject could not be found.',
            'error'
        );

        return;
    }


    const subjectName =
        getSubjectName(
            subject
        );


    const confirmed =
        window.confirm(
            `Deactivate "${subjectName}"?\n\nThis subject will no longer be available for new academic setup selections. Existing records will not be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Deactivating subject...',
            'success'
        );


        await callApi(
            'deactivateSubject',
            {
                schoolId:
                    getSchoolId(),

                subjectId:
                    subjectId
            }
        );


        showMessage(
            'Subject deactivated successfully.',
            'success'
        );


        await loadSubjects();

    } catch (error) {

        console.error(
            'Deactivate subject error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to deactivate subject.',
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
            editingSubjectId
                ? 'Saving...'
                : 'Creating...';

    } else {

        saveButton.textContent =
            editingSubjectId
                ? 'Save Changes'
                : 'Create Subject';

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
                Loading subjects...
            </span>

        </div>

    `;

}


function showEmptyState() {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No subjects yet
            </strong>

            <span>
                Create your first subject to begin
                setting up your school.
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
                Unable to load subjects
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
   SUBJECT FIELD HELPERS
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


function getSubjectCode(
    subject
) {

    return String(
        subject['Subject Code'] ||
        subject.subjectCode ||
        ''
    ).trim();

}


function normalizeStatus(
    subject
) {

    const raw =
        String(
            subject['Status'] ||
            subject.status ||
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
