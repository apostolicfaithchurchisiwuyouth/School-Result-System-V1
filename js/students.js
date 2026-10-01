/* =========================================================
   SCHOOL RESULTS SYSTEM
   FILE: students.js
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

let students = [];

let classes = [];

let editingStudentId = null;


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

const activeStudentCount =
    document.getElementById('activeStudentCount');

const recordCount =
    document.getElementById('recordCount');

const tableWrapper =
    document.getElementById('tableWrapper');

const studentModal =
    document.getElementById('studentModal');

const modalTitle =
    document.getElementById('modalTitle');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');

const studentForm =
    document.getElementById('studentForm');

const admissionNo =
    document.getElementById('admissionNo');

const studentName =
    document.getElementById('studentName');

const studentGender =
    document.getElementById('studentGender');

const dateOfBirth =
    document.getElementById('dateOfBirth');

const classId =
    document.getElementById('classId');

const formError =
    document.getElementById('formError');

const saveButton =
    document.getElementById('saveButton');


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    initializeStudentsPage
);


async function initializeStudentsPage() {

    currentSession =
        loadSession();


    if (!currentSession) {

        redirectToLogin();

        return;

    }


    populateUserInterface();

    setupEventListeners();


    try {

        await loadClasses();

        await loadStudents();

    } catch (error) {

        console.error(
            'Students initialization error:',
            error
        );

        showMessage(
            error.message ||
            'Unable to load student records.',
            'error'
        );

        renderErrorState(
            error.message ||
            'Unable to load student records.'
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
   EVENT LISTENERS
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
        closeStudentModal
    );


    cancelButton.addEventListener(
        'click',
        closeStudentModal
    );


    closeMessage.addEventListener(
        'click',
        hideMessage
    );


    studentForm.addEventListener(
        'submit',
        handleStudentSubmit
    );


    studentModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                studentModal
            ) {

                closeStudentModal();

            }

        }
    );


    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape' &&
                !studentModal.classList.contains('hidden')
            ) {

                closeStudentModal();

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
   LOAD CLASSES
========================================================= */

async function loadClasses() {

    const schoolId =
        getSchoolId();


    if (!schoolId) {

        throw new Error(
            'School information is missing from your session.'
        );

    }


    const result =
        await callApi(
            'getActiveClasses',
            {
                schoolId
            }
        );


    classes =
        extractArray(
            result,
            'classes'
        );


    populateClassSelect();

}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

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
            'getStudents',
            {
                schoolId
            }
        );


    students =
        extractArray(
            result,
            'students'
        );


    updateSummary();

    renderStudents();

}


/* =========================================================
   RESPONSE HELPERS
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
   CLASS SELECT
========================================================= */

function populateClassSelect(
    selectedValue = ''
) {

    classId.innerHTML =
        '';


    const defaultOption =
        document.createElement(
            'option'
        );


    defaultOption.value =
        '';


    defaultOption.textContent =
        'Select class';


    classId.appendChild(
        defaultOption
    );


    classes.forEach(
        function (classItem) {

            const id =
                classItem['Class ID'] ||
                classItem.classId ||
                classItem.id ||
                '';


            const name =
                classItem['Class Name'] ||
                classItem.className ||
                classItem.name ||
                '';


            const section =
                classItem['Section'] ||
                classItem.section ||
                '';


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
                section
                    ? `${name} — ${section}`
                    : name;


            if (
                String(id) ===
                String(selectedValue)
            ) {

                option.selected =
                    true;

            }


            classId.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const activeStudents =
        students.filter(
            function (student) {

                const status =
                    student['Status'] ||
                    student.status ||
                    'Active';

                return (
                    String(status)
                        .toLowerCase() ===
                    'active'
                );

            }
        );


    activeStudentCount.textContent =
        activeStudents.length;


    recordCount.textContent =
        `${students.length} ${
            students.length === 1
                ? 'student'
                : 'students'
        }`;

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

    if (!students.length) {

        renderEmptyState();

        return;

    }


    const table =
        document.createElement(
            'table'
        );


    table.className =
        'students-table';


    table.innerHTML = `

        <thead>

            <tr>

                <th>
                    #
                </th>

                <th>
                    ADMISSION NO.
                </th>

                <th>
                    FULL NAME
                </th>

                <th>
                    GENDER
                </th>

                <th>
                    DATE OF BIRTH
                </th>

                <th>
                    CLASS
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


    students.forEach(
        function (student, index) {

            const id =
                student['Student ID'] ||
                student.studentId ||
                student.id ||
                '';


            const admission =
                student['Admission No'] ||
                student.admissionNo ||
                '';


            const name =
                student['Full Name'] ||
                student.fullName ||
                '';


            const gender =
                student['Gender'] ||
                student.gender ||
                '';


            const dob =
                student['Date of Birth'] ||
                student.dateOfBirth ||
                '';


            const studentClass =
                getClassName(
                    student['Class ID'] ||
                    student.classId ||
                    ''
                );


            const status =
                student['Status'] ||
                student.status ||
                'Active';


            const row =
                document.createElement(
                    'tr'
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td class="admission-cell">
                    ${escapeHtml(admission)}
                </td>

                <td class="student-name-cell">
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${
                        gender
                            ? escapeHtml(gender)
                            : '<span class="muted-value">Not provided</span>'
                    }
                </td>

                <td>
                    ${
                        dob
                            ? escapeHtml(formatDate(dob))
                            : '<span class="muted-value">Not provided</span>'
                    }
                </td>

                <td class="class-cell">
                    ${escapeHtml(studentClass)}
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

                        deactivateStudent(
                            id,
                            name
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
   CLASS NAME
========================================================= */

function getClassName(
    classIdValue
) {

    const classItem =
        classes.find(
            function (item) {

                const id =
                    item['Class ID'] ||
                    item.classId ||
                    item.id ||
                    '';

                return (
                    String(id) ===
                    String(classIdValue)
                );

            }
        );


    if (!classItem) {

        return 'Unknown class';

    }


    const name =
        classItem['Class Name'] ||
        classItem.className ||
        classItem.name ||
        '';


    const section =
        classItem['Section'] ||
        classItem.section ||
        '';


    return section
        ? `${name} — ${section}`
        : name;

}


/* =========================================================
   LOADING STATE
========================================================= */

function renderLoadingState() {

    tableWrapper.innerHTML = `

        <div class="loading-state">

            <div class="spinner"></div>

            <span>
                Loading students...
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
                No students yet
            </strong>

            <span>
                Create your first student to begin
                managing student records.
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
                Unable to load students
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;

}


/* =========================================================
   CREATE MODAL
========================================================= */

function openCreateModal() {

    editingStudentId =
        null;


    modalTitle.textContent =
        'Create Student';


    saveButton.textContent =
        'Create Student';


    studentForm.reset();


    populateClassSelect();


    clearFormError();


    studentModal.classList.remove(
        'hidden'
    );


    document.body.style.overflow =
        'hidden';


    setTimeout(
        function () {

            admissionNo.focus();

        },
        100
    );

}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(
    studentId
) {

    const student =
        students.find(
            function (item) {

                const id =
                    item['Student ID'] ||
                    item.studentId ||
                    item.id ||
                    '';

                return (
                    String(id) ===
                    String(studentId)
                );

            }
        );


    if (!student) {

        showMessage(
            'Student record could not be found.',
            'error'
        );

        return;

    }


    editingStudentId =
        studentId;


    modalTitle.textContent =
        'Edit Student';


    saveButton.textContent =
        'Save Changes';


    admissionNo.value =
        student['Admission No'] ||
        student.admissionNo ||
        '';


    studentName.value =
        student['Full Name'] ||
        student.fullName ||
        '';


    studentGender.value =
        student['Gender'] ||
        student.gender ||
        '';


    dateOfBirth.value =
        formatDateForInput(
            student['Date of Birth'] ||
            student.dateOfBirth ||
            ''
        );


    populateClassSelect(
        student['Class ID'] ||
        student.classId ||
        ''
    );


    clearFormError();


    studentModal.classList.remove(
        'hidden'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeStudentModal() {

    studentModal.classList.add(
        'hidden'
    );


    document.body.style.overflow =
        '';


    studentForm.reset();

    populateClassSelect();

    clearFormError();


    editingStudentId =
        null;

}


/* =========================================================
   SAVE STUDENT
========================================================= */

async function handleStudentSubmit(
    event
) {

    event.preventDefault();


    clearFormError();


    const schoolId =
        getSchoolId();


    const admissionNumber =
        admissionNo.value.trim();


    const fullName =
        studentName.value.trim();


    const gender =
        studentGender.value;


    const dob =
        dateOfBirth.value;


    const selectedClassId =
        classId.value;


    if (!schoolId) {

        showFormError(
            'Your school session is missing. Please log in again.'
        );

        return;

    }


    if (!admissionNumber) {

        showFormError(
            'Please enter the admission number.'
        );

        admissionNo.focus();

        return;

    }


    if (!fullName) {

        showFormError(
            'Please enter the student\'s full name.'
        );

        studentName.focus();

        return;

    }


    if (!selectedClassId) {

        showFormError(
            'Please select the student\'s class.'
        );

        classId.focus();

        return;

    }


    saveButton.disabled =
        true;


    saveButton.textContent =
        editingStudentId
            ? 'Saving...'
            : 'Creating...';


    try {

        if (editingStudentId) {

            await callApi(
                'updateStudent',
                {
                    schoolId,

                    studentId:
                        editingStudentId,

                    admissionNo:
                        admissionNumber,

                    fullName,

                    gender,

                    dateOfBirth:
                        dob,

                    classId:
                        selectedClassId
                }
            );


            closeStudentModal();


            showMessage(
                'Student updated successfully.',
                'success'
            );

        } else {

            await callApi(
                'createStudent',
                {
                    schoolId,

                    admissionNo:
                        admissionNumber,

                    fullName,

                    gender,

                    dateOfBirth:
                        dob,

                    classId:
                        selectedClassId,

                    status:
                        'Active'
                }
            );


            closeStudentModal();


            showMessage(
                'Student created successfully.',
                'success'
            );

        }


        await loadStudents();

    } catch (error) {

        console.error(
            'Save student error:',
            error
        );

        showFormError(
            error.message ||
            'Unable to save student.'
        );

    } finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            editingStudentId
                ? 'Save Changes'
                : 'Create Student';

    }

}


/* =========================================================
   DEACTIVATE STUDENT
========================================================= */

async function deactivateStudent(
    studentId,
    name
) {

    const confirmed =
        window.confirm(
            `Are you sure you want to deactivate ${name || 'this student'}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await callApi(
            'deactivateStudent',
            {
                schoolId:
                    getSchoolId(),

                studentId
            }
        );


        showMessage(
            'Student deactivated successfully.',
            'success'
        );


        await loadStudents();

    } catch (error) {

        console.error(
            'Deactivate student error:',
            error
        );

        showMessage(
            error.message ||
            'Unable to deactivate student.',
            'error'
        );

    }

}


/* =========================================================
   DATE HELPERS
========================================================= */

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


    return new Intl.DateTimeFormat(
        'en-NG',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    ).format(date);

}


function formatDateForInput(
    value
) {

    if (!value) {
        return '';
    }


    const stringValue =
        String(value);


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '';

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        );


    return `${year}-${month}-${day}`;

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
