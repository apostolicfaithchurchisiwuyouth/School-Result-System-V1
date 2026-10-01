/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: classes.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Classes management frontend.
 *
 * CONNECTS TO:
 * createClass
 * getClasses
 * getActiveClasses
 * updateClass
 * deactivateClass
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

let classes = [];

let editingClassId = null;


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

const classModal =
    document.getElementById('classModal');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const classForm =
    document.getElementById('classForm');

const classNameInput =
    document.getElementById('className');

const sectionInput =
    document.getElementById('section');

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

const activeClassCount =
    document.getElementById('activeClassCount');

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

    await loadClasses();
}


/* ============================================================
   SESSION
============================================================ */

function getStoredSession() {

    try {

        const raw =
            localStorage.getItem(SESSION_KEY);

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


    /* Mobile menu */

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


    /* Logout */

    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            handleLogout
        );

    }


    /* Create */

    if (openCreateButton) {

        openCreateButton.addEventListener(
            'click',
            openCreateModal
        );

    }


    /* Modal */

    if (closeModalButton) {

        closeModalButton.addEventListener(
            'click',
            closeClassModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            'click',
            closeClassModal
        );

    }


    if (classModal) {

        classModal.addEventListener(
            'click',
            event => {

                if (
                    event.target ===
                    classModal
                ) {

                    closeClassModal();

                }

            }
        );

    }


    /* Form */

    if (classForm) {

        classForm.addEventListener(
            'submit',
            handleClassSubmit
        );

    }


    /* Message */

    if (closeMessage) {

        closeMessage.addEventListener(
            'click',
            hideMessage
        );

    }


    /* Escape */

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape'
            ) {

                closeSidebar();

                closeClassModal();

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
   LOAD CLASSES
============================================================ */

async function loadClasses() {

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
                'getClasses',
                {
                    schoolId: schoolId
                }
            );


        classes =
            extractRecords(result);


        renderClasses();

    } catch (error) {

        console.error(
            'Load classes error:',
            error
        );


        showTableError(
            error.message ||
            'Unable to load classes.'
        );


        showMessage(
            error.message ||
            'Unable to load classes.',
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

        action: action,

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
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'text/plain;charset=utf-8'
                    },

                    body:
                        JSON.stringify(payload)
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
        Array.isArray(result.classes)
    ) {

        return result.classes;

    }


    if (
        Array.isArray(result.data)
    ) {

        return result.data;

    }


    if (
        result.data &&
        Array.isArray(result.data.classes)
    ) {

        return result.data.classes;

    }


    return [];
}


/* ============================================================
   RENDER CLASSES
============================================================ */

function renderClasses() {

    const total =
        classes.length;


    const active =
        classes.filter(
            item =>
                normalizeStatus(
                    item
                ) === 'Active'
        ).length;


    recordCount.textContent =
        `${total} ${total === 1 ? 'class' : 'classes'}`;


    activeClassCount.textContent =
        active;


    if (!total) {

        showEmptyState();

        return;
    }


    const rows =
        classes
            .map(
                (classItem, index) =>
                    renderClassRow(
                        classItem,
                        index
                    )
            )
            .join('');


    tableWrapper.innerHTML = `

        <table class="classes-table">

            <thead>

                <tr>

                    <th>
                        #
                    </th>

                    <th>
                        CLASS
                    </th>

                    <th>
                        SECTION
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


    attachClassActions();
}


/* ============================================================
   RENDER CLASS ROW
============================================================ */

function renderClassRow(
    classItem,
    index
) {

    const id =
        getClassId(
            classItem
        );


    const name =
        escapeHtml(
            getClassName(
                classItem
            )
        );


    const sectionValue =
        getSection(
            classItem
        );


    const section =
        sectionValue
            ? escapeHtml(sectionValue)
            : '<span class="muted-value">—</span>';


    const status =
        normalizeStatus(
            classItem
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

            <td class="class-name-cell">
                ${name}
            </td>

            <td class="section-cell">
                ${section}
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
   CLASS ACTIONS
============================================================ */

function attachClassActions() {

    const buttons =
        tableWrapper.querySelectorAll(
            '[data-action]'
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                'click',
                handleClassAction
            );

        }
    );

}


async function handleClassAction(event) {

    const button =
        event.currentTarget;


    const action =
        button.dataset.action;


    const classId =
        button.dataset.id;


    if (!classId) {

        showMessage(
            'The selected class could not be identified.',
            'error'
        );

        return;
    }


    if (action === 'edit') {

        openEditModal(
            classId
        );

        return;
    }


    if (action === 'deactivate') {

        await deactivateClass(
            classId
        );

    }

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    editingClassId = null;


    modalTitle.textContent =
        'Create Class';


    saveButton.textContent =
        'Create Class';


    classForm.reset();

    hideFormError();


    classModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => classNameInput.focus(),
        50
    );

}


function openEditModal(classId) {

    const classItem =
        classes.find(
            item =>
                getClassId(item) ===
                classId
        );


    if (!classItem) {

        showMessage(
            'The selected class could not be found.',
            'error'
        );

        return;
    }


    editingClassId =
        classId;


    modalTitle.textContent =
        'Edit Class';


    saveButton.textContent =
        'Save Changes';


    classNameInput.value =
        getClassName(
            classItem
        );


    sectionInput.value =
        getSection(
            classItem
        );


    hideFormError();


    classModal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => classNameInput.focus(),
        50
    );

}


function closeClassModal() {

    classModal.classList.add(
        'hidden'
    );


    editingClassId =
        null;


    classForm.reset();

    hideFormError();

}


/* ============================================================
   FORM SUBMISSION
============================================================ */

async function handleClassSubmit(
    event
) {

    event.preventDefault();


    hideFormError();


    const className =
        classNameInput.value.trim();


    const section =
        sectionInput.value.trim();


    if (!className) {

        showFormError(
            'Please enter a class name.'
        );

        classNameInput.focus();

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


    setSavingState(true);


    try {

        let result;


        if (editingClassId) {

            result =
                await callApi(
                    'updateClass',
                    {
                        schoolId:
                            schoolId,

                        classId:
                            editingClassId,

                        className:
                            className,

                        section:
                            section
                    }
                );


        } else {

            result =
                await callApi(
                    'createClass',
                    {
                        schoolId:
                            schoolId,

                        className:
                            className,

                        section:
                            section,

                        status:
                            'Active'
                    }
                );

        }


        console.log(
            'Class save result:',
            result
        );


        closeClassModal();


        showMessage(
            editingClassId
                ? 'Class updated successfully.'
                : 'Class created successfully.',
            'success'
        );


        await loadClasses();

    } catch (error) {

        console.error(
            'Save class error:',
            error
        );


        showFormError(
            error.message ||
            'Unable to save class.'
        );

    } finally {

        setSavingState(false);

    }

}


/* ============================================================
   DEACTIVATE CLASS
============================================================ */

async function deactivateClass(
    classId
) {

    const classItem =
        classes.find(
            item =>
                getClassId(item) ===
                classId
        );


    if (!classItem) {

        showMessage(
            'The selected class could not be found.',
            'error'
        );

        return;
    }


    const className =
        getClassName(
            classItem
        );


    const confirmed =
        window.confirm(
            `Deactivate "${className}"?\n\nThis class will no longer be available for new academic setup selections. Existing records will not be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            'Deactivating class...',
            'success'
        );


        const result =
            await callApi(
                'deactivateClass',
                {
                    schoolId:
                        getSchoolId(),

                    classId:
                        classId
                }
            );


        console.log(
            'Deactivate result:',
            result
        );


        showMessage(
            'Class deactivated successfully.',
            'success'
        );


        await loadClasses();

    } catch (error) {

        console.error(
            'Deactivate class error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to deactivate class.',
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
            editingClassId
                ? 'Saving...'
                : 'Creating...';

    } else {

        saveButton.textContent =
            editingClassId
                ? 'Save Changes'
                : 'Create Class';

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
                Loading classes...
            </span>

        </div>

    `;

}


function showEmptyState() {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No classes yet
            </strong>

            <span>
                Create your first class to begin
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
                Unable to load classes
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
   CLASS FIELD HELPERS
============================================================ */

function getClassId(
    classItem
) {

    return String(
        classItem['Class ID'] ||
        classItem.classId ||
        classItem.id ||
        ''
    ).trim();

}


function getClassName(
    classItem
) {

    return String(
        classItem['Class Name'] ||
        classItem.className ||
        ''
    ).trim();

}


function getSection(
    classItem
) {

    return String(
        classItem['Section'] ||
        classItem.section ||
        ''
    ).trim();

}


function normalizeStatus(
    classItem
) {

    const raw =
        String(
            classItem['Status'] ||
            classItem.status ||
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
