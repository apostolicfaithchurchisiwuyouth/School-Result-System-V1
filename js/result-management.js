/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: result-management.js
   VERSION: 1.4.0

   PURPOSE:
   - Result management page
   - Session / Term / Class selection
   - Result overview
   - Student result list
   - Student result modal
   - Teacher / Principal comments
   - Permanent comment saving
   - Student result PDF generation
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
let currentSetup = null;

let currentSelected = {
    sessionId: '',
    term: '',
    classId: ''
};

let currentViewedStudentId = '';
let currentViewedResult = null;
let currentOverview = null;


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    initializePage();

});


/* ============================================================
   INITIALIZE PAGE
============================================================ */

async function initializePage() {

    try {

        currentSession = loadSession();

        if (!currentSession) {
            redirectToLogin();
            return;
        }

        bindGlobalEvents();

        await loadSetup();

    } catch (error) {

        console.error('Page initialization error:', error);

        showPageMessage(
            'Unable to load the result management page. Please refresh and try again.',
            'error'
        );

    }

}


/* ============================================================
   SESSION
============================================================ */

function loadSession() {

    try {

        const raw =
            localStorage.getItem(SESSION_KEY);

        if (!raw) {
            return null;
        }

        const parsed =
            JSON.parse(raw);

        return normalizeSession(parsed);

    } catch (error) {

        console.error('Session parsing error:', error);

        return null;

    }

}


function normalizeSession(session) {

    if (!session || typeof session !== 'object') {
        return null;
    }

    const user =
        session.user ||
        session.data?.user ||
        {};

    const school =
        session.school ||
        session.data?.school ||
        {};

    const schoolId =
        firstValue(
            session.schoolId,
            user.schoolId,
            school.schoolId,
            session.data?.schoolId,
            ''
        );

    const userId =
        firstValue(
            session.userId,
            user.userId,
            session.data?.userId,
            ''
        );

    const fullName =
        firstValue(
            session.fullName,
            user.fullName,
            session.data?.fullName,
            ''
        );

    const email =
        firstValue(
            session.email,
            user.email,
            session.data?.email,
            ''
        );

    const role =
        firstValue(
            session.role,
            user.role,
            session.data?.role,
            ''
        );

    const schoolName =
        firstValue(
            session.schoolName,
            school.schoolName,
            session.data?.schoolName,
            ''
        );

    if (!schoolId) {
        return null;
    }

    return {
        ...session,
        schoolId,
        userId,
        fullName,
        email,
        role,
        schoolName
    };

}


/* ============================================================
   GLOBAL EVENTS
============================================================ */

function bindGlobalEvents() {

    const logoutButton =
        document.getElementById('logoutButton');

    if (logoutButton) {

        logoutButton.addEventListener('click', handleLogout);

    }


    const closeMessage =
        document.getElementById('closeMessage');

    if (closeMessage) {

        closeMessage.addEventListener('click', () => {

            hidePageMessage();

        });

    }


    const closeStudentResultButton =
        document.getElementById('closeStudentResultButton');

    if (closeStudentResultButton) {

        closeStudentResultButton.addEventListener(
            'click',
            closeStudentResultModal
        );

    }


    const cancelResultButton =
        document.getElementById('cancelResultButton');

    if (cancelResultButton) {

        cancelResultButton.addEventListener(
            'click',
            closeStudentResultModal
        );

    }


    const studentResultModal =
        document.getElementById('studentResultModal');

    if (studentResultModal) {

        studentResultModal.addEventListener('click', (event) => {

            if (event.target === studentResultModal) {

                closeStudentResultModal();

            }

        });

    }


    const sessionSelect =
        document.getElementById('sessionSelect');

    const termSelect =
        document.getElementById('termSelect');

    const classSelect =
        document.getElementById('classSelect');


    if (sessionSelect) {

        sessionSelect.addEventListener('change', handleSelectionChange);

    }


    if (termSelect) {

        termSelect.addEventListener('change', handleSelectionChange);

    }


    if (classSelect) {

        classSelect.addEventListener('change', handleSelectionChange);

    }

}


/* ============================================================
   LOGOUT
============================================================ */

function handleLogout() {

    localStorage.removeItem(SESSION_KEY);

    currentSession = null;

    redirectToLogin();

}


function redirectToLogin() {

    window.location.href = 'index.html';

}


/* ============================================================
   LOAD SETUP
============================================================ */

async function loadSetup() {

    showSelectionLoading();

    const response =
        await apiRequest(
            'getResultManagementSetup',
            {
                schoolId: currentSession.schoolId
            }
        );

    if (!response || !response.success) {

        throw new Error(
            response?.message ||
            'Unable to load result management setup.'
        );

    }

    currentSetup = response;

    populateSessionSelect(response.sessions || []);
    populateTermSelect(response.terms || []);
    populateClassSelect(response.classes || []);

    applyDefaultSelections();

    await loadResultData();

}


/* ============================================================
   POPULATE SESSION SELECT
============================================================ */

function populateSessionSelect(sessions) {

    const select =
        document.getElementById('sessionSelect');

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select Session</option>';

    sessions.forEach(session => {

        const option =
            document.createElement('option');

        option.value =
            session.sessionId;

        option.textContent =
            session.sessionName;

        select.appendChild(option);

    });

}


/* ============================================================
   POPULATE TERM SELECT
============================================================ */

function populateTermSelect(terms) {

    const select =
        document.getElementById('termSelect');

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select Term</option>';

    terms.forEach(term => {

        const option =
            document.createElement('option');

        option.value =
            term;

        option.textContent =
            term;

        select.appendChild(option);

    });

}


/* ============================================================
   POPULATE CLASS SELECT
============================================================ */

function populateClassSelect(classes) {

    const select =
        document.getElementById('classSelect');

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select Class</option>';

    classes.forEach(item => {

        const option =
            document.createElement('option');

        option.value =
            item.classId;

        option.textContent =
            item.section
                ? `${item.className} - ${item.section}`
                : item.className;

        select.appendChild(option);

    });

}


/* ============================================================
   DEFAULT SELECTIONS
============================================================ */

function applyDefaultSelections() {

    const sessionSelect =
        document.getElementById('sessionSelect');

    const termSelect =
        document.getElementById('termSelect');

    const classSelect =
        document.getElementById('classSelect');


    if (sessionSelect && currentSetup.sessions?.length) {

        const activeSession =
            currentSetup.sessions.find(
                session => session.status === 'Active'
            );

        const selectedSession =
            activeSession ||
            currentSetup.sessions[0];

        sessionSelect.value =
            selectedSession.sessionId;

        currentSelected.sessionId =
            selectedSession.sessionId;

    }


    if (termSelect && currentSetup.terms?.length) {

        const preferredTerm =
            currentSetup.terms.includes('First Term')
                ? 'First Term'
                : currentSetup.terms[0];

        termSelect.value =
            preferredTerm;

        currentSelected.term =
            preferredTerm;

    }


    if (classSelect && currentSetup.classes?.length) {

        const activeClass =
            currentSetup.classes.find(
                item => item.status === 'Active'
            );

        const selectedClass =
            activeClass ||
            currentSetup.classes[0];

        classSelect.value =
            selectedClass.classId;

        currentSelected.classId =
            selectedClass.classId;

    }

}


/* ============================================================
   SELECTION CHANGE
============================================================ */

async function handleSelectionChange() {

    const sessionSelect =
        document.getElementById('sessionSelect');

    const termSelect =
        document.getElementById('termSelect');

    const classSelect =
        document.getElementById('classSelect');


    currentSelected = {

        sessionId:
            sessionSelect?.value || '',

        term:
            termSelect?.value || '',

        classId:
            classSelect?.value || ''

    };


    if (
        !currentSelected.sessionId ||
        !currentSelected.term ||
        !currentSelected.classId
    ) {

        hideResultSections();

        showSelectionMessage(
            'Please select a session, term and class.'
        );

        return;

    }


    hideSelectionMessage();

    await loadResultData();

}


/* ============================================================
   LOAD RESULT DATA
============================================================ */

async function loadResultData() {

    if (
        !currentSelected.sessionId ||
        !currentSelected.term ||
        !currentSelected.classId
    ) {

        return;

    }


    showOverviewLoading();
    showStudentsLoading();


    try {

        await Promise.all([
            loadOverview(),
            loadStudents()
        ]);

        hideSelectionMessage();

    } catch (error) {

        console.error(
            'Result data loading error:',
            error
        );

        showPageMessage(
            error.message ||
            'Unable to load result data.',
            'error'
        );

    }

}


/* ============================================================
   LOAD OVERVIEW
============================================================ */

async function loadOverview() {

    const response =
        await apiRequest(
            'getResultManagementOverview',
            {
                schoolId:
                    currentSession.schoolId,

                sessionId:
                    currentSelected.sessionId,

                term:
                    currentSelected.term,

                classId:
                    currentSelected.classId
            }
        );


    if (!response || !response.success) {

        throw new Error(
            response?.message ||
            'Unable to load result overview.'
        );

    }


    currentOverview =
        response;


    renderOverview(response);

}


/* ============================================================
   RENDER OVERVIEW
============================================================ */

function renderOverview(data) {

    const students =
        data.students || {};

    const validation =
        data.validation || {};


    setText(
        'totalStudents',
        students.total ?? 0
    );

    setText(
        'completedStudents',
        students.complete ?? 0
    );

    setText(
        'incompleteStudents',
        students.incomplete ?? 0
    );

    setText(
        'notStartedStudents',
        students.notStarted ?? 0
    );


    const selectedClass =
        getSelectedClass();

    const selectedSession =
        getSelectedSession();


    setText(
        'overviewTitle',
        selectedClass
            ? selectedClass.section
                ? `${selectedClass.className} - ${selectedClass.section}`
                : selectedClass.className
            : 'Result Overview'
    );


    setText(
        'overviewSubtitle',
        selectedSession
            ? `${selectedSession.sessionName} • ${currentSelected.term}`
            : currentSelected.term
    );


    renderReadiness(validation);

    renderValidation(validation);


    const overviewSection =
        document.getElementById('overviewSection');

    if (overviewSection) {

        overviewSection.hidden = false;

    }

}


/* ============================================================
   READINESS
============================================================ */

function renderReadiness(validation) {

    const badge =
        document.getElementById('readinessBadge');

    if (!badge) {
        return;
    }


    const ready =
        validation.ready === true;


    badge.textContent =
        ready
            ? 'Ready for PDF'
            : 'Not Ready';


    badge.classList.remove(
        'ready',
        'not-ready',
        'success',
        'danger'
    );


    badge.classList.add(
        ready
            ? 'ready'
            : 'not-ready'
    );

}


/* ============================================================
   VALIDATION
============================================================ */

function renderValidation(validation) {

    const title =
        document.getElementById('validationTitle');

    const message =
        document.getElementById('validationMessage');

    const icon =
        document.querySelector('.validation-icon');


    const ready =
        validation.ready === true;


    if (title) {

        title.textContent =
            ready
                ? 'Results are ready'
                : 'Results need attention';

    }


    if (message) {

        if (ready) {

            message.textContent =
                'All required result records are complete and ready for PDF generation.';

        } else {

            message.textContent =
                validation.message ||
                'Some result records are incomplete or contain missing scores.';

        }

    }


    if (icon) {

        icon.textContent =
            ready
                ? '✓'
                : '!';

        icon.classList.toggle(
            'success',
            ready
        );

        icon.classList.toggle(
            'warning',
            !ready
        );

    }

}


/* ============================================================
   LOAD STUDENTS
============================================================ */

async function loadStudents() {

    const response =
        await apiRequest(
            'getResultManagementStudents',
            {
                schoolId:
                    currentSession.schoolId,

                sessionId:
                    currentSelected.sessionId,

                term:
                    currentSelected.term,

                classId:
                    currentSelected.classId
            }
        );


    if (!response || !response.success) {

        throw new Error(
            response?.message ||
            'Unable to load students.'
        );

    }


    renderStudents(response);

}


/* ============================================================
   RENDER STUDENTS
============================================================ */

function renderStudents(data) {

    const students =
        Array.isArray(data.students)
            ? data.students
            : [];


    setText(
        'recordCount',
        `${students.length} student${students.length === 1 ? '' : 's'}`
    );


    const loading =
        document.getElementById('tableLoading');

    const empty =
        document.getElementById('tableEmpty');

    const table =
        document.getElementById('resultsTable');

    const tbody =
        document.getElementById('resultsTableBody');


    if (loading) {
        loading.hidden = true;
    }


    if (!students.length) {

        if (empty) {
            empty.hidden = false;
        }

        if (table) {
            table.hidden = true;
        }

        showStudentsSection();

        return;

    }


    if (empty) {
        empty.hidden = true;
    }

    if (table) {
        table.hidden = false;
    }


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        students.map(
            student => buildStudentRow(student)
        ).join('');


    tbody
        .querySelectorAll('[data-view-student]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const studentId =
                        button.dataset.viewStudent;

                    openStudentResult(studentId);

                }
            );

        });


    showStudentsSection();

}


/* ============================================================
   BUILD STUDENT ROW
============================================================ */

function buildStudentRow(student) {

    const status =
        normalizeStatus(
            student.completionStatus
        );


    const statusClass =
        getStatusClass(status);


    const total =
        formatNumber(student.total);


    const average =
        formatAverage(student.average);


    const position =
        formatPosition(
            student.position
        );


    return `
        <tr>

            <td>
                ${escapeHtml(
                    student.admissionNo || '—'
                )}
            </td>

            <td>
                <strong>
                    ${escapeHtml(
                        student.fullName || '—'
                    )}
                </strong>
            </td>

            <td>
                ${total}
            </td>

            <td>
                ${average}
            </td>

            <td>
                ${position}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="table-action-button"
                    data-view-student="${escapeHtmlAttribute(student.studentId)}"
                >
                    View Result
                </button>

            </td>

        </tr>
    `;

}


/* ============================================================
   OPEN STUDENT RESULT
============================================================ */

async function openStudentResult(studentId) {

    if (!studentId) {
        return;
    }


    currentViewedStudentId =
        studentId;


    openStudentResultModal();

    showResultModalLoading();


    try {

        const response =
            await apiRequest(
                'getResultManagementStudent',
                {
                    schoolId:
                        currentSession.schoolId,

                    sessionId:
                        currentSelected.sessionId,

                    term:
                        currentSelected.term,

                    studentId
                }
            );


        if (!response || !response.success) {

            throw new Error(
                response?.message ||
                'Unable to load student result.'
            );

        }


        let result =
            response.result || {};


        /*
         * Make sure comments are loaded from the backend.
         * getFinalStudentResult normally includes them,
         * but this additional request makes the modal
         * reliable even if the result object has no comments.
         */

        if (!result.comments) {

            const commentResponse =
                await apiRequest(
                    'getResultComments',
                    {
                        schoolId:
                            currentSession.schoolId,

                        sessionId:
                            currentSelected.sessionId,

                        term:
                            currentSelected.term,

                        studentId
                    }
                );


            if (
                commentResponse &&
                commentResponse.success
            ) {

                result.comments =
                    commentResponse.comments ||
                    commentResponse.comment ||
                    {};

            }

        }


        currentViewedResult =
            result;


        renderStudentResult(result);


    } catch (error) {

        console.error(
            'Student result loading error:',
            error
        );


        showResultModalError(
            error.message ||
            'Unable to load this student result.'
        );

    }

}


/* ============================================================
   RENDER STUDENT RESULT
============================================================ */

function renderStudentResult(result) {

    const student =
        result.student || {};

    const school =
        result.school || {};

    const session =
        result.session || {};

    const summary =
        result.summary || {};

    const comments =
        result.comments || {};


    const subjects =
        Array.isArray(result.subjects)
            ? result.subjects
            : [];


    const position =
        firstValue(
            result.position &&
                result.position.position,

            summary.position,

            result.position &&
                result.position.value,

            null
        );


    setText(
        'studentResultTitle',
        student.fullName
            ? `${student.fullName} — Result`
            : 'Student Result'
    );


    const modalBody =
        document.getElementById('resultModalBody');


    if (!modalBody) {
        return;
    }


    modalBody.innerHTML = `

        <div class="student-result-preview">

            <div class="result-school-header">

                ${
                    school.logoUrl
                        ? `
                            <img
                                src="${escapeHtmlAttribute(school.logoUrl)}"
                                alt="${escapeHtmlAttribute(school.schoolName || 'School Logo')}"
                                class="result-school-logo"
                            >
                        `
                        : ''
                }

                <div class="result-school-details">

                    <h2>
                        ${escapeHtml(
                            school.schoolName || 'School'
                        )}
                    </h2>

                    ${
                        school.address
                            ? `
                                <p>
                                    ${escapeHtml(
                                        school.address
                                    )}
                                </p>
                            `
                            : ''
                    }

                    ${
                        school.phone || school.email
                            ? `
                                <p>
                                    ${escapeHtml(
                                        [school.phone, school.email]
                                            .filter(Boolean)
                                            .join(' • ')
                                    )}
                                </p>
                            `
                            : ''
                    }

                </div>

            </div>


            <div class="result-student-information">

                <div class="result-info-item">

                    <span class="result-info-label">
                        Student
                    </span>

                    <strong>
                        ${escapeHtml(
                            student.fullName || '—'
                        )}
                    </strong>

                </div>


                <div class="result-info-item">

                    <span class="result-info-label">
                        Admission No.
                    </span>

                    <strong>
                        ${escapeHtml(
                            student.admissionNo || '—'
                        )}
                    </strong>

                </div>


                <div class="result-info-item">

                    <span class="result-info-label">
                        Class
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatClass(result.class)
                        )}
                    </strong>

                </div>


                <div class="result-info-item">

                    <span class="result-info-label">
                        Session
                    </span>

                    <strong>
                        ${escapeHtml(
                            session.sessionName || '—'
                        )}
                    </strong>

                </div>


                <div class="result-info-item">

                    <span class="result-info-label">
                        Term
                    </span>

                    <strong>
                        ${escapeHtml(
                            result.term || '—'
                        )}
                    </strong>

                </div>


                <div class="result-info-item">

                    <span class="result-info-label">
                        Position
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatPosition(position)
                        )}
                    </strong>

                </div>

            </div>


            <div class="result-subject-table-wrapper">

                <table class="result-subject-table">

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

                    <tbody>

                        ${
                            subjects.length
                                ? subjects
                                    .map(
                                        subject =>
                                            buildSubjectRow(subject)
                                    )
                                    .join('')
                                : `
                                    <tr>

                                        <td
                                            colspan="6"
                                            class="result-empty-cell"
                                        >
                                            No subject records available.
                                        </td>

                                    </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>


            <div class="result-summary-grid">

                <div class="result-summary-item">

                    <span>
                        Total Score
                    </span>

                    <strong>
                        ${formatNumber(
                            firstValue(
                                summary.total,
                                summary.totalScore,
                                0
                            )
                        )}
                    </strong>

                </div>


                <div class="result-summary-item">

                    <span>
                        Average
                    </span>

                    <strong>
                        ${formatAverage(
                            firstValue(
                                summary.average,
                                0
                            )
                        )}
                    </strong>

                </div>


                <div class="result-summary-item">

                    <span>
                        Position
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatPosition(position)
                        )}
                    </strong>

                </div>

            </div>


            ${buildCommentsEditor(comments)}


            <section class="result-comments">

                <div class="result-comment">

                    <div class="result-comment-title">
                        Teacher's Comment
                    </div>

                    <div
                        class="result-comment-text"
                        id="displayTeacherComment"
                    >
                        ${escapeHtml(
                            comments.teacherComment ||
                            'No teacher comment added.'
                        )}
                    </div>

                </div>


                <div class="result-comment">

                    <div class="result-comment-title">
                        Principal's Comment
                    </div>

                    <div
                        class="result-comment-text"
                        id="displayPrincipalComment"
                    >
                        ${escapeHtml(
                            comments.principalComment ||
                            'No principal comment added.'
                        )}
                    </div>

                </div>

            </section>


            <div class="result-pdf-actions">

                <button
                    type="button"
                    class="primary-button result-pdf-button"
                    id="generateStudentPdfButton"
                >
                    Generate Student PDF
                </button>

            </div>

        </div>

    `;


    bindCommentEditor();


    const generatePdfButton =
        document.getElementById(
            'generateStudentPdfButton'
        );


    if (generatePdfButton) {

        generatePdfButton.addEventListener(
            'click',
            generateCurrentStudentPdf
        );

    }

}


/* ============================================================
   BUILD SUBJECT ROW
============================================================ */

function buildSubjectRow(subject) {

    return `

        <tr>

            <td>
                ${escapeHtml(
                    firstValue(
                        subject.subjectName,
                        subject.name,
                        '—'
                    )
                )}
            </td>

            <td>
                ${formatNumber(
                    firstValue(
                        subject.testScore,
                        subject.test,
                        ''
                    )
                )}
            </td>

            <td>
                ${formatNumber(
                    firstValue(
                        subject.examScore,
                        subject.exam,
                        ''
                    )
                )}
            </td>

            <td>
                ${formatNumber(
                    firstValue(
                        subject.totalScore,
                        subject.total,
                        ''
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    firstValue(
                        subject.grade,
                        '—'
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    firstValue(
                        subject.remark,
                        '—'
                    )
                )}
            </td>

        </tr>

    `;

}


/* ============================================================
   COMMENTS EDITOR
============================================================ */

function buildCommentsEditor(comments) {

    const teacherComment =
        comments?.teacherComment || '';

    const principalComment =
        comments?.principalComment || '';


    return `

        <section class="result-comments-editor">

            <div class="result-comments-editor-header">

                <div class="result-comment-title">
                    Result Comments
                </div>

                <p class="result-comments-help">
                    Add or update the teacher's and principal's comments for this student's result.
                </p>

            </div>


            <div class="result-comment-field">

                <label for="teacherCommentInput">
                    Teacher's Comment
                </label>

                <textarea
                    id="teacherCommentInput"
                    class="result-comment-input"
                    maxlength="500"
                    rows="4"
                    placeholder="Enter teacher's comment..."
                >${escapeHtml(teacherComment)}</textarea>

                <div class="result-comment-counter">

                    <span>
                        Maximum 500 characters
                    </span>

                    <span id="teacherCommentCounter">
                        ${teacherComment.length}/500
                    </span>

                </div>

            </div>


            <div class="result-comment-field">

                <label for="principalCommentInput">
                    Principal's Comment
                </label>

                <textarea
                    id="principalCommentInput"
                    class="result-comment-input"
                    maxlength="500"
                    rows="4"
                    placeholder="Enter principal's comment..."
                >${escapeHtml(principalComment)}</textarea>

                <div class="result-comment-counter">

                    <span>
                        Maximum 500 characters
                    </span>

                    <span id="principalCommentCounter">
                        ${principalComment.length}/500
                    </span>

                </div>

            </div>


            <div class="result-comment-actions">

                <button
                    type="button"
                    class="primary-button"
                    id="saveResultCommentsButton"
                >
                    Save Comments
                </button>

                <span
                    class="result-comment-save-status"
                    id="resultCommentSaveStatus"
                ></span>

            </div>

        </section>

    `;

}


/* ============================================================
   BIND COMMENT EDITOR
============================================================ */

function bindCommentEditor() {

    const teacherInput =
        document.getElementById(
            'teacherCommentInput'
        );

    const principalInput =
        document.getElementById(
            'principalCommentInput'
        );

    const saveButton =
        document.getElementById(
            'saveResultCommentsButton'
        );


    if (teacherInput) {

        teacherInput.addEventListener(
            'input',
            updateCommentCounter
        );

    }


    if (principalInput) {

        principalInput.addEventListener(
            'input',
            updateCommentCounter
        );

    }


    if (saveButton) {

        saveButton.addEventListener(
            'click',
            saveCurrentResultComments
        );

    }


    updateCommentCounter();

}


/* ============================================================
   COMMENT COUNTERS
============================================================ */

function updateCommentCounter() {

    const teacherInput =
        document.getElementById(
            'teacherCommentInput'
        );

    const principalInput =
        document.getElementById(
            'principalCommentInput'
        );


    const teacherCounter =
        document.getElementById(
            'teacherCommentCounter'
        );

    const principalCounter =
        document.getElementById(
            'principalCommentCounter'
        );


    if (teacherInput && teacherCounter) {

        teacherCounter.textContent =
            `${teacherInput.value.length}/500`;

    }


    if (principalInput && principalCounter) {

        principalCounter.textContent =
            `${principalInput.value.length}/500`;

    }

}


/* ============================================================
   SAVE COMMENTS
============================================================ */

async function saveCurrentResultComments() {

    if (!currentViewedStudentId) {

        setCommentSaveStatus(
            'No student selected.',
            'error'
        );

        return;

    }


    const teacherInput =
        document.getElementById(
            'teacherCommentInput'
        );

    const principalInput =
        document.getElementById(
            'principalCommentInput'
        );


    const saveButton =
        document.getElementById(
            'saveResultCommentsButton'
        );


    const teacherComment =
        teacherInput
            ? teacherInput.value.trim()
            : '';

    const principalComment =
        principalInput
            ? principalInput.value.trim()
            : '';


    if (
        teacherComment.length > 500 ||
        principalComment.length > 500
    ) {

        setCommentSaveStatus(
            'Each comment must be 500 characters or less.',
            'error'
        );

        return;

    }


    /*
     * IMPORTANT:
     *
     * The backend action is SAVE COMMENT.
     * It is NOT saveResultComments.
     *
     * This is the main persistence fix.
     */

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.dataset.originalText =
            saveButton.textContent;

        saveButton.textContent =
            'Saving...';

    }


    setCommentSaveStatus(
        'Saving comments...',
        ''
    );


    try {

        const response =
            await apiRequest(
                'saveComment',
                {
                    schoolId:
                        currentSession.schoolId,

                    sessionId:
                        currentSelected.sessionId,

                    term:
                        currentSelected.term,

                    studentId:
                        currentViewedStudentId,

                    teacherComment,

                    principalComment,

                    updatedBy:
                        currentSession.userId ||
                        currentSession.fullName ||
                        currentSession.email ||
                        ''
                }
            );


        if (!response || !response.success) {

            throw new Error(
                response?.message ||
                'Unable to save comments.'
            );

        }


        /*
         * Update the current in-memory result only
         * after the backend confirms success.
         *
         * The permanent copy is in Google Sheets.
         */

        if (!currentViewedResult) {

            currentViewedResult = {};

        }


        if (!currentViewedResult.comments) {

            currentViewedResult.comments = {};

        }


        currentViewedResult.comments.teacherComment =
            teacherComment;

        currentViewedResult.comments.principalComment =
            principalComment;


        /*
         * Update the visible comments immediately.
         */

        const displayTeacherComment =
            document.getElementById(
                'displayTeacherComment'
            );

        const displayPrincipalComment =
            document.getElementById(
                'displayPrincipalComment'
            );


        if (displayTeacherComment) {

            displayTeacherComment.textContent =
                teacherComment ||
                'No teacher comment added.';

        }


        if (displayPrincipalComment) {

            displayPrincipalComment.textContent =
                principalComment ||
                'No principal comment added.';

        }


        /*
         * IMPORTANT:
         *
         * We do NOT use localStorage for comments.
         *
         * The Comments sheet is the permanent source.
         */

        setCommentSaveStatus(
            'Comments saved successfully.',
            'success'
        );


    } catch (error) {

        console.error(
            'Save comments error:',
            error
        );


        setCommentSaveStatus(
            error.message ||
            'Unable to save comments.',
            'error'
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                saveButton.dataset.originalText ||
                'Save Comments';

        }

    }

}


/* ============================================================
   COMMENT SAVE STATUS
============================================================ */

function setCommentSaveStatus(message, type) {

    const status =
        document.getElementById(
            'resultCommentSaveStatus'
        );


    if (!status) {
        return;
    }


    status.textContent =
        message || '';


    status.classList.remove(
        'success',
        'error'
    );


    if (type) {

        status.classList.add(type);

    }

}


/* ============================================================
   GENERATE STUDENT PDF
============================================================ */

async function generateCurrentStudentPdf() {

    if (!currentViewedStudentId) {

        showPageMessage(
            'No student result is currently selected.',
            'error'
        );

        return;

    }


    const button =
        document.getElementById(
            'generateStudentPdfButton'
        );


    if (button) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            'Generating PDF...';

    }


    try {

        const response =
            await apiRequest(
                'generateStudentResultPdf',
                {
                    schoolId:
                        currentSession.schoolId,

                    sessionId:
                        currentSelected.sessionId,

                    term:
                        currentSelected.term,

                    studentId:
                        currentViewedStudentId
                }
            );


        if (!response || !response.success) {

            throw new Error(
                response?.message ||
                'Unable to generate student PDF.'
            );

        }


        const file =
            response.file || {};


        if (file.downloadUrl) {

            window.open(
                file.downloadUrl,
                '_blank'
            );

        } else if (file.url) {

            window.open(
                file.url,
                '_blank'
            );

        } else {

            showPageMessage(
                response.message ||
                'Student PDF generated successfully.',
                'success'
            );

        }


    } catch (error) {

        console.error(
            'PDF generation error:',
            error
        );


        showPageMessage(
            error.message ||
            'Unable to generate student PDF.',
            'error'
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                'Generate Student PDF';

        }

    }

}


/* ============================================================
   MODAL
============================================================ */

function openStudentResultModal() {

    const modal =
        document.getElementById(
            'studentResultModal'
        );


    if (!modal) {
        return;
    }


    modal.hidden = false;

    document.body.classList.add(
        'modal-open'
    );

}


function closeStudentResultModal() {

    const modal =
        document.getElementById(
            'studentResultModal'
        );


    if (modal) {

        modal.hidden = true;

    }


    document.body.classList.remove(
        'modal-open'
    );


    /*
     * We intentionally do NOT clear currentViewedResult
     * here. More importantly, reopening the student result
     * loads the comments again from Google Sheets.
     */

}


/* ============================================================
   MODAL LOADING
============================================================ */

function showResultModalLoading() {

    const body =
        document.getElementById(
            'resultModalBody'
        );


    if (!body) {
        return;
    }


    body.innerHTML = `

        <div class="result-modal-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading student result...
            </p>

        </div>

    `;

}


/* ============================================================
   MODAL ERROR
============================================================ */

function showResultModalError(message) {

    const body =
        document.getElementById(
            'resultModalBody'
        );


    if (!body) {
        return;
    }


    body.innerHTML = `

        <div class="result-modal-error">

            <h3>
                Unable to load result
            </h3>

            <p>
                ${escapeHtml(
                    message ||
                    'Something went wrong.'
                )}
            </p>

            <button
                type="button"
                class="primary-button"
                id="retryStudentResultButton"
            >
                Try Again
            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            'retryStudentResultButton'
        );


    if (retryButton) {

        retryButton.addEventListener(
            'click',
            () => openStudentResult(
                currentViewedStudentId
            )
        );

    }

}


/* ============================================================
   SELECTION MESSAGE
============================================================ */

function showSelectionMessage(message) {

    const box =
        document.getElementById(
            'selectionMessage'
        );

    const text =
        document.getElementById(
            'selectionMessageText'
        );


    if (text) {

        text.textContent =
            message || '';

    }


    if (box) {

        box.hidden = false;

    }

}


function hideSelectionMessage() {

    const box =
        document.getElementById(
            'selectionMessage'
        );


    if (box) {

        box.hidden = true;

    }

}


/* ============================================================
   PAGE MESSAGE
============================================================ */

function showPageMessage(message, type = 'info') {

    const box =
        document.getElementById(
            'pageMessage'
        );

    const text =
        document.getElementById(
            'messageText'
        );


    if (!box) {
        return;
    }


    if (text) {

        text.textContent =
            message || '';

    }


    box.classList.remove(
        'success',
        'error',
        'info',
        'warning'
    );


    box.classList.add(type);


    box.hidden = false;

}


function hidePageMessage() {

    const box =
        document.getElementById(
            'pageMessage'
        );


    if (box) {

        box.hidden = true;

    }

}


/* ============================================================
   SECTION VISIBILITY
============================================================ */

function showOverviewLoading() {

    const section =
        document.getElementById(
            'overviewSection'
        );

    if (section) {

        section.hidden = false;

    }

}


function showStudentsLoading() {

    const section =
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


    if (section) {

        section.hidden = false;

    }


    if (loading) {

        loading.hidden = false;

    }


    if (table) {

        table.hidden = true;

    }


    if (empty) {

        empty.hidden = true;

    }

}


function showStudentsSection() {

    const section =
        document.getElementById(
            'studentsSection'
        );

    if (section) {

        section.hidden = false;

    }

}


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

        overview.hidden = true;

    }


    if (students) {

        students.hidden = true;

    }

}


/* ============================================================
   SETUP LOADING
============================================================ */

function showSelectionLoading() {

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


    [
        sessionSelect,
        termSelect,
        classSelect
    ].forEach(select => {

        if (select) {

            select.disabled = true;

        }

    });

}


/* ============================================================
   SELECTED CLASS / SESSION
============================================================ */

function getSelectedClass() {

    if (!currentSetup?.classes) {
        return null;
    }


    return currentSetup.classes.find(
        item =>
            item.classId ===
            currentSelected.classId
    ) || null;

}


function getSelectedSession() {

    if (!currentSetup?.sessions) {
        return null;
    }


    return currentSetup.sessions.find(
        item =>
            item.sessionId ===
            currentSelected.sessionId
    ) || null;

}


/* ============================================================
   FORMATTING
============================================================ */

function formatClass(classData) {

    if (!classData) {
        return '—';
    }


    return classData.section
        ? `${classData.className || ''} - ${classData.section}`
        : classData.className || '—';

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


    if (!Number.isFinite(number)) {

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


    if (!Number.isFinite(number)) {

        return escapeHtml(
            String(value)
        );

    }


    return number.toFixed(2);

}


function formatPosition(value) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '—';

    }


    const stringValue =
        String(value).trim();


    if (!stringValue) {
        return '—';
    }


    if (
        /^(1st|2nd|3rd|\d+th)$/i.test(
            stringValue
        )
    ) {

        return stringValue;

    }


    const number =
        Number(stringValue);


    if (
        Number.isInteger(number) &&
        number > 0
    ) {

        const lastTwo =
            number % 100;

        let suffix = 'th';

        if (
            lastTwo !== 11 &&
            lastTwo !== 12 &&
            lastTwo !== 13
        ) {

            switch (number % 10) {

                case 1:
                    suffix = 'st';
                    break;

                case 2:
                    suffix = 'nd';
                    break;

                case 3:
                    suffix = 'rd';
                    break;

            }

        }


        return `${number}${suffix}`;

    }


    return escapeHtml(
        stringValue
    );

}


function normalizeStatus(status) {

    if (!status) {
        return 'Not Started';
    }


    const normalized =
        String(status)
            .trim()
            .toLowerCase();


    if (
        normalized === 'complete' ||
        normalized === 'completed'
    ) {

        return 'Complete';

    }


    if (
        normalized === 'incomplete'
    ) {

        return 'Incomplete';

    }


    return 'Not Started';

}


function getStatusClass(status) {

    switch (status) {

        case 'Complete':
            return 'status-complete';

        case 'Incomplete':
            return 'status-incomplete';

        default:
            return 'status-not-started';

    }

}


/* ============================================================
   GENERIC HELPERS
============================================================ */

function firstValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ''
        ) {

            return value;

        }

    }

    return null;

}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? '';

    }

}


/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(action, data = {}) {

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


    if (!response.ok) {

        throw new Error(
            `Server request failed (${response.status}).`
        );

    }


    const text =
        await response.text();


    let parsed;


    try {

        parsed =
            JSON.parse(text);

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
   ESCAPING
============================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function escapeHtmlAttribute(value) {

    return escapeHtml(value);

}


/* ============================================================
   END
============================================================ */
