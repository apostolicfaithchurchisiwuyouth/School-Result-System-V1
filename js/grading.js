/* =========================================================
   SCHOOL RESULTS SYSTEM
   FILE: grading.js
   VERSION: 1.0.0
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';

const SESSION_KEY =
    'school_results_system_session_v1';


/* =========================================================
   STATE
========================================================= */

let currentSession = null;

let gradingRules = [];

let editingGradingId = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const sidebar =
    document.getElementById('sidebar');

const menuButton =
    document.getElementById('menuButton');

const sidebarOverlay =
    document.getElementById('sidebarOverlay');

const logoutButton =
    document.getElementById('logoutButton');

const schoolName =
    document.getElementById('schoolName');

const userName =
    document.getElementById('userName');

const userRole =
    document.getElementById('userRole');

const userInitials =
    document.getElementById('userInitials');

const openCreateButton =
    document.getElementById('openCreateButton');

const pageMessage =
    document.getElementById('pageMessage');

const messageText =
    document.getElementById('messageText');

const closeMessage =
    document.getElementById('closeMessage');

const activeGradingCount =
    document.getElementById('activeGradingCount');

const recordCount =
    document.getElementById('recordCount');

const tableWrapper =
    document.getElementById('tableWrapper');

const gradingModal =
    document.getElementById('gradingModal');

const modalTitle =
    document.getElementById('modalTitle');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const gradingForm =
    document.getElementById('gradingForm');

const gradeInput =
    document.getElementById('grade');

const minScoreInput =
    document.getElementById('minScore');

const maxScoreInput =
    document.getElementById('maxScore');

const remarkInput =
    document.getElementById('remark');

const formError =
    document.getElementById('formError');

const saveButton =
    document.getElementById('saveButton');


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    initializeGradingPage
);


async function initializeGradingPage() {

    currentSession =
        loadSession();


    if (!currentSession) {

        redirectToLogin();

        return;

    }


    populateUserInterface();

    setupEventListeners();


    try {

        await loadGradingRules();

    } catch (error) {

        console.error(
            'Grading initialization error:',
            error
        );

        showMessage(
            error.message ||
            'Unable to load grading rules.',
            'error'
        );

        renderErrorState(
            error.message ||
            'Unable to load grading rules.'
        );

    }

}


/* =========================================================
   SESSION
========================================================= */

function loadSession() {

    try {

        const savedSession =
            localStorage.getItem(
                SESSION_KEY
            );


        if (!savedSession) {
            return null;
        }


        return JSON.parse(
            savedSession
        );

    } catch (error) {

        console.error(
            'Session read error:',
            error
        );

        return null;

    }

}


function getSchoolId() {

    const user =
        currentSession?.user || {};

    const school =
        currentSession?.school || {};


    return (
        school.schoolId ||
        school['School ID'] ||
        user.schoolId ||
        user['School ID'] ||
        currentSession.schoolId ||
        currentSession['School ID'] ||
        ''
    );

}


/* =========================================================
   USER INTERFACE
========================================================= */

function populateUserInterface() {

    const user =
        currentSession?.user || {};

    const school =
        currentSession?.school || {};


    const name =
        school.schoolName ||
        school['School Name'] ||
        currentSession.schoolName ||
        'School Results System';


    const fullName =
        user.fullName ||
        user['Full Name'] ||
        currentSession.fullName ||
        'User';


    const role =
        user.role ||
        currentSession.role ||
        '--';


    schoolName.textContent =
        name;


    userName.textContent =
        fullName;


    userRole.textContent =
        role;


    userInitials.textContent =
        getInitials(fullName);

}


function getInitials(name) {

    const value =
        String(name || '')
            .trim();


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


/* =========================================================
   EVENTS
========================================================= */

function setupEventListeners() {

    menuButton.addEventListener(
        'click',
        toggleSidebar
    );


    sidebarOverlay.addEventListener(
        'click',
        closeSidebar
    );


    logoutButton.addEventListener(
        'click',
        handleLogout
    );


    openCreateButton.addEventListener(
        'click',
        openCreateModal
    );


    closeModalButton.addEventListener(
        'click',
        closeGradingModal
    );


    cancelButton.addEventListener(
        'click',
        closeGradingModal
    );


    closeMessage.addEventListener(
        'click',
        hideMessage
    );


    gradingForm.addEventListener(
        'submit',
        handleGradingSubmit
    );


    gradingModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                gradingModal
            ) {

                closeGradingModal();

            }

        }
    );


    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape' &&
                !gradingModal.classList.contains('hidden')
            ) {

                closeGradingModal();

            }

        }
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    sidebar.classList.toggle(
        'open'
    );

    sidebarOverlay.classList.toggle(
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


/* =========================================================
   API
========================================================= */

async function callApi(
    action,
    data = {}
) {

    const payload = {
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
                    JSON.stringify(payload)
            }
        );


    const responseText =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(responseText);

    } catch (error) {

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


/* =========================================================
   LOAD GRADING RULES
========================================================= */

async function loadGradingRules() {

    const schoolId =
        getSchoolId();


    if (!schoolId) {

        throw new Error(
            'School information is missing from your session.'
        );

    }


    renderLoadingState();


    const result =
        await callApi(
            'getGradingRules',
            {
                schoolId
            }
        );


    gradingRules =
        extractArray(
            result,
            'gradingRules'
        );


    updateSummary();

    renderGradingRules();

}


/* =========================================================
   RESPONSE HELPER
========================================================= */

function extractArray(
    result,
    property
) {

    if (!result) {
        return [];
    }


    if (
        Array.isArray(
            result[property]
        )
    ) {

        return result[property];

    }


    if (
        result.data &&
        Array.isArray(
            result.data[property]
        )
    ) {

        return result.data[property];

    }


    if (
        Array.isArray(
            result.data
        )
    ) {

        return result.data;

    }


    return [];

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const activeRules =
        gradingRules.filter(
            function (rule) {

                const status =
                    rule['Status'] ||
                    rule.status ||
                    'Active';


                return (
                    String(status)
                        .trim()
                        .toLowerCase() ===
                    'active'
                );

            }
        );


    activeGradingCount.textContent =
        activeRules.length;


    recordCount.textContent =
        `${gradingRules.length} ${
            gradingRules.length === 1
                ? 'grade'
                : 'grades'
        }`;

}


/* =========================================================
   RENDER GRADING RULES
========================================================= */

function renderGradingRules() {

    if (!gradingRules.length) {

        renderEmptyState();

        return;

    }


    const table =
        document.createElement(
            'table'
        );


    table.className =
        'grading-table';


    table.innerHTML = `

        <thead>

            <tr>

                <th>
                    #
                </th>

                <th>
                    GRADE
                </th>

                <th>
                    SCORE RANGE
                </th>

                <th>
                    REMARK
                </th>

                <th>
                    STATUS
                </th>

                <th>
                    ACTIONS
                </th>

            </tr>

        </thead>

        <tbody></tbody>

    `;


    const tbody =
        table.querySelector(
            'tbody'
        );


    const sortedRules =
        [...gradingRules].sort(
            function (a, b) {

                const aMin =
                    Number(
                        a['Min Score'] ??
                        a.minScore ??
                        0
                    );


                const bMin =
                    Number(
                        b['Min Score'] ??
                        b.minScore ??
                        0
                    );


                return bMin - aMin;

            }
        );


    sortedRules.forEach(
        function (rule, index) {

            const id =
                rule['Grading ID'] ||
                rule.gradingId ||
                rule.id ||
                '';


            const grade =
                rule['Grade'] ||
                rule.grade ||
                '';


            const minScore =
                rule['Min Score'] ??
                rule.minScore ??
                '';


            const maxScore =
                rule['Max Score'] ??
                rule.maxScore ??
                '';


            const remark =
                rule['Remark'] ||
                rule.remark ||
                '';


            const status =
                rule['Status'] ||
                rule.status ||
                'Active';


            const row =
                document.createElement(
                    'tr'
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td class="grade-cell">
                    ${escapeHtml(grade)}
                </td>

                <td class="range-cell">
                    ${formatScore(minScore)}
                    –
                    ${formatScore(maxScore)}
                </td>

                <td class="remark-cell">
                    ${
                        remark
                            ? escapeHtml(remark)
                            : '<span class="muted-value">No remark</span>'
                    }
                </td>

                <td>

                    <span class="status-badge ${
                        String(status).toLowerCase() === 'active'
                            ? 'active'
                            : 'inactive'
                    }">

                        ${escapeHtml(status)}

                    </span>

                </td>

                <td>

                    <div class="action-group">

                        <button
                            type="button"
                            class="edit-button"
                            data-action="edit"
                        >
                            Edit
                        </button>

                        ${
                            String(status).toLowerCase() === 'active'
                                ? `
                                    <button
                                        type="button"
                                        class="deactivate-button"
                                        data-action="deactivate"
                                    >
                                        Deactivate
                                    </button>
                                  `
                                : ''
                        }

                    </div>

                </td>

            `;


            const editButton =
                row.querySelector(
                    '[data-action="edit"]'
                );


            editButton.addEventListener(
                'click',
                function () {

                    openEditModal(id);

                }
            );


            const deactivateButton =
                row.querySelector(
                    '[data-action="deactivate"]'
                );


            if (deactivateButton) {

                deactivateButton.addEventListener(
                    'click',
                    function () {

                        deactivateGradingRule(
                            id,
                            grade
                        );

                    }
                );

            }


            tbody.appendChild(
                row
            );

        }
    );


    tableWrapper.innerHTML =
        '';


    tableWrapper.appendChild(
        table
    );

}


/* =========================================================
   SCORE FORMAT
========================================================= */

function formatScore(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(value);

    }


    return Number.isInteger(number)
        ? String(number)
        : String(number);

}


/* =========================================================
   CREATE MODAL
========================================================= */

function openCreateModal() {

    editingGradingId =
        null;


    modalTitle.textContent =
        'Create Grading Rule';


    saveButton.textContent =
        'Create Grade';


    gradingForm.reset();


    clearFormError();


    gradingModal.classList.remove(
        'hidden'
    );


    document.body.style.overflow =
        'hidden';


    setTimeout(
        function () {

            gradeInput.focus();

        },
        100
    );

}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(
    gradingId
) {

    const rule =
        gradingRules.find(
            function (item) {

                const id =
                    item['Grading ID'] ||
                    item.gradingId ||
                    item.id ||
                    '';


                return (
                    String(id) ===
                    String(gradingId)
                );

            }
        );


    if (!rule) {

        showMessage(
            'Grading rule could not be found.',
            'error'
        );

        return;

    }


    editingGradingId =
        gradingId;


    modalTitle.textContent =
        'Edit Grading Rule';


    saveButton.textContent =
        'Save Changes';


    gradeInput.value =
        rule['Grade'] ||
        rule.grade ||
        '';


    minScoreInput.value =
        rule['Min Score'] ??
        rule.minScore ??
        '';


    maxScoreInput.value =
        rule['Max Score'] ??
        rule.maxScore ??
        '';


    remarkInput.value =
        rule['Remark'] ||
        rule.remark ||
        '';


    clearFormError();


    gradingModal.classList.remove(
        'hidden'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeGradingModal() {

    gradingModal.classList.add(
        'hidden'
    );


    document.body.style.overflow =
        '';


    gradingForm.reset();

    clearFormError();


    editingGradingId =
        null;

}


/* =========================================================
   SAVE GRADING RULE
========================================================= */

async function handleGradingSubmit(
    event
) {

    event.preventDefault();


    clearFormError();


    const schoolId =
        getSchoolId();


    const grade =
        gradeInput.value.trim();


    const minScore =
        Number(
            minScoreInput.value
        );


    const maxScore =
        Number(
            maxScoreInput.value
        );


    const remark =
        remarkInput.value.trim();


    if (!schoolId) {

        showFormError(
            'Your school session is missing. Please log in again.'
        );

        return;

    }


    if (!grade) {

        showFormError(
            'Please enter a grade.'
        );

        gradeInput.focus();

        return;

    }


    if (
        minScoreInput.value === '' ||
        Number.isNaN(minScore)
    ) {

        showFormError(
            'Please enter a valid minimum score.'
        );

        minScoreInput.focus();

        return;

    }


    if (
        maxScoreInput.value === '' ||
        Number.isNaN(maxScore)
    ) {

        showFormError(
            'Please enter a valid maximum score.'
        );

        maxScoreInput.focus();

        return;

    }


    if (
        minScore < 0 ||
        minScore > 100
    ) {

        showFormError(
            'Minimum score must be between 0 and 100.'
        );

        minScoreInput.focus();

        return;

    }


    if (
        maxScore < 0 ||
        maxScore > 100
    ) {

        showFormError(
            'Maximum score must be between 0 and 100.'
        );

        maxScoreInput.focus();

        return;

    }


    if (
        minScore > maxScore
    ) {

        showFormError(
            'Minimum score cannot be greater than maximum score.'
        );

        minScoreInput.focus();

        return;

    }


    saveButton.disabled =
        true;


    saveButton.textContent =
        editingGradingId
            ? 'Saving...'
            : 'Creating...';


    try {

        if (editingGradingId) {

            await callApi(
                'updateGradingRule',
                {
                    schoolId,

                    gradingId:
                        editingGradingId,

                    grade,

                    minScore,

                    maxScore,

                    remark
                }
            );


            closeGradingModal();


            showMessage(
                'Grading rule updated successfully.',
                'success'
            );

        } else {

            await callApi(
                'createGradingRule',
                {
                    schoolId,

                    grade,

                    minScore,

                    maxScore,

                    remark,

                    status:
                        'Active'
                }
            );


            closeGradingModal();


            showMessage(
                'Grading rule created successfully.',
                'success'
            );

        }


        await loadGradingRules();

    } catch (error) {

        console.error(
            'Save grading rule error:',
            error
        );

        showFormError(
            error.message ||
            'Unable to save grading rule.'
        );

    } finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            editingGradingId
                ? 'Save Changes'
                : 'Create Grade';

    }

}


/* =========================================================
   DEACTIVATE
========================================================= */

async function deactivateGradingRule(
    gradingId,
    grade
) {

    const confirmed =
        window.confirm(
            `Are you sure you want to deactivate grade ${grade || 'this grade'}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await callApi(
            'deactivateGradingRule',
            {
                schoolId:
                    getSchoolId(),

                gradingId
            }
        );


        showMessage(
            'Grading rule deactivated successfully.',
            'success'
        );


        await loadGradingRules();

    } catch (error) {

        console.error(
            'Deactivate grading rule error:',
            error
        );

        showMessage(
            error.message ||
            'Unable to deactivate grading rule.',
            'error'
        );

    }

}


/* =========================================================
   LOADING STATE
========================================================= */

function renderLoadingState() {

    tableWrapper.innerHTML = `

        <div class="loading-state">

            <div class="spinner"></div>

            <span>
                Loading grading rules...
            </span>

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState() {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No grading rules yet
            </strong>

            <span>
                Create your first grading rule to
                configure how student scores are graded.
            </span>

        </div>

    `;

}


/* =========================================================
   ERROR STATE
========================================================= */

function renderErrorState(
    message
) {

    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                Unable to load grading rules
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = ''
) {

    messageText.textContent =
        message;


    pageMessage.classList.remove(
        'hidden',
        'success',
        'error'
    );


    if (type) {

        pageMessage.classList.add(
            type
        );

    }

}


function hideMessage() {

    pageMessage.classList.add(
        'hidden'
    );

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    formError.textContent =
        message;


    formError.classList.remove(
        'hidden'
    );

}


function clearFormError() {

    formError.textContent =
        '';


    formError.classList.add(
        'hidden'
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

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


    currentSession =
        null;


    redirectToLogin();

}


function redirectToLogin() {

    window.location.href =
        'index.html';

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ''
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
