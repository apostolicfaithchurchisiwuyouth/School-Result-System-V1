/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: result-management.js
 * VERSION: 1.0.0
 *
 * PURPOSE:
 * Result Management frontend.
 * ============================================================
 */


/* ============================================================
   CONFIGURATION
============================================================ */

const RESULT_API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';


/*
 * Replace the value above with the same deployed
 * Apps Script /exec URL already used by your system.
 */


/* ============================================================
   STATE
============================================================ */

const resultState = {

    schoolId:
        null,

    sessionId:
        null,

    term:
        null,

    classId:
        null,

    students:
        [],

    selectedStudentId:
        null,

    setup:
        null

};



/* ============================================================
   DOM
============================================================ */

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


const loadResultsButton =
    document.getElementById(
        'loadResultsButton'
    );


const refreshButton =
    document.getElementById(
        'refreshButton'
    );


const generateClassPdfButton =
    document.getElementById(
        'generateClassPdfButton'
    );


const overviewSection =
    document.getElementById(
        'overviewSection'
    );


const studentsSection =
    document.getElementById(
        'studentsSection'
    );


const studentsTableBody =
    document.getElementById(
        'studentsTableBody'
    );


const messageBox =
    document.getElementById(
        'messageBox'
    );


const loadingOverlay =
    document.getElementById(
        'loadingOverlay'
    );


const loadingText =
    document.getElementById(
        'loadingText'
    );


const resultModal =
    document.getElementById(
        'resultModal'
    );


const modalStudentName =
    document.getElementById(
        'modalStudentName'
    );


const modalContent =
    document.getElementById(
        'modalContent'
    );


const generateStudentPdfButton =
    document.getElementById(
        'generateStudentPdfButton'
    );



/* ============================================================
   INITIALIZE
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initializeResultManagement
);


async function initializeResultManagement() {

    setupModalEvents();

    refreshButton.addEventListener(
        'click',
        loadSetup
    );


    loadResultsButton.addEventListener(
        'click',
        loadResults
    );


    generateClassPdfButton.addEventListener(
        'click',
        generateClassPdfs
    );


    generateStudentPdfButton.addEventListener(
        'click',
        generateSelectedStudentPdf
    );


    try {

        resultState.schoolId =
            getSchoolId();


        if (
            !resultState.schoolId
        ) {

            showMessage(
                'No school session was found. Please log in first.',
                'error'
            );

            return;

        }


        await loadSetup();

    } catch (error) {

        showMessage(
            error.message,
            'error'
        );

    }

}



/* ============================================================
   SCHOOL ID
============================================================ */

function getSchoolId() {

    /*
     * Adjust these keys if your existing
     * login system uses a different key.
     */

    const possibleKeys = [

        'schoolId',

        'school_id',

        'School ID',

        'school'

    ];


    for (
        let i = 0;
        i < possibleKeys.length;
        i++
    ) {

        const value =
            localStorage.getItem(
                possibleKeys[i]
            );


        if (value) {

            try {

                const parsed =
                    JSON.parse(value);


                if (
                    parsed &&
                    parsed.schoolId
                ) {

                    return String(
                        parsed.schoolId
                    );

                }

            } catch (error) {

                return String(
                    value
                );

            }

        }

    }


    return null;

}



/* ============================================================
   LOAD SETUP
============================================================ */

async function loadSetup() {

    showLoading(
        'Loading result setup...'
    );


    try {

        const response =
            await apiRequest(
                'getResultManagementSetup',
                {

                    schoolId:
                        resultState.schoolId

                }
            );


        if (
            !response.success
        ) {

            throw new Error(
                response.error ||
                'Could not load result setup.'
            );

        }


        resultState.setup =
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


    } finally {

        hideLoading();

    }

}



/* ============================================================
   POPULATE SESSIONS
============================================================ */

function populateSessions(
    sessions
) {

    sessionSelect.innerHTML =
        '<option value="">Select session</option>';


    sessions.forEach(function(session) {

        const option =
            document.createElement(
                'option'
            );


        option.value =
            session.sessionId;


        option.textContent =
            session.sessionName;


        sessionSelect.appendChild(
            option
        );

    });


    if (
        sessions.length === 1
    ) {

        sessionSelect.value =
            sessions[0].sessionId;

    }

}



/* ============================================================
   POPULATE TERMS
============================================================ */

function populateTerms(
    terms
) {

    termSelect.innerHTML =
        '<option value="">Select term</option>';


    terms.forEach(function(term) {

        const option =
            document.createElement(
                'option'
            );


        option.value =
            term;


        option.textContent =
            term;


        termSelect.appendChild(
            option
        );

    });


    if (
        terms.length === 1
    ) {

        termSelect.value =
            terms[0];

    }

}



/* ============================================================
   POPULATE CLASSES
============================================================ */

function populateClasses(
    classes
) {

    classSelect.innerHTML =
        '<option value="">Select class</option>';


    classes.forEach(function(classItem) {

        const option =
            document.createElement(
                'option'
            );


        option.value =
            classItem.classId;


        option.textContent =
            classItem.section
                ? classItem.className +
                  ' - ' +
                  classItem.section
                : classItem.className;


        classSelect.appendChild(
            option
        );

    });

}



/* ============================================================
   LOAD RESULTS
============================================================ */

async function loadResults() {

    const sessionId =
        sessionSelect.value;


    const term =
        termSelect.value;


    const classId =
        classSelect.value;


    if (!sessionId) {

        showMessage(
            'Please select a session.',
            'error'
        );

        return;

    }


    if (!term) {

        showMessage(
            'Please select a term.',
            'error'
        );

        return;

    }


    if (!classId) {

        showMessage(
            'Please select a class.',
            'error'
        );

        return;

    }


    resultState.sessionId =
        sessionId;


    resultState.term =
        term;


    resultState.classId =
        classId;


    showLoading(
        'Loading class results...'
    );


    try {

        const overview =
            await apiRequest(
                'getResultManagementOverview',
                {

                    schoolId:
                        resultState.schoolId,

                    sessionId:
                        sessionId,

                    term:
                        term,

                    classId:
                        classId

                }
            );


        if (
            !overview.success
        ) {

            throw new Error(
                overview.error ||
                'Could not load result overview.'
            );

        }


        renderOverview(
            overview
        );


        const students =
            await apiRequest(
                'getResultManagementStudents',
                {

                    schoolId:
                        resultState.schoolId,

                    sessionId:
                        sessionId,

                    term:
                        term,

                    classId:
                        classId

                }
            );


        if (
            !students.success
        ) {

            throw new Error(
                students.error ||
                'Could not load students.'
            );

        }


        resultState.students =
            students.students || [];


        renderStudents(
            resultState.students
        );


        overviewSection.classList.remove(
            'hidden'
        );


        studentsSection.classList.remove(
            'hidden'
        );


        window.scrollTo({

            top:
                overviewSection.offsetTop -
                20,

            behavior:
                'smooth'

        });


        showMessage(
            'Results loaded successfully.',
            'success'
        );


    } catch (error) {

        showMessage(
            error.message,
            'error'
        );

    } finally {

        hideLoading();

    }

}



/* ============================================================
   RENDER OVERVIEW
============================================================ */

function renderOverview(
    overview
) {

    const students =
        overview.students || {};


    document.getElementById(
        'totalStudents'
    ).textContent =
        students.total || 0;


    document.getElementById(
        'completeStudents'
    ).textContent =
        students.complete || 0;


    document.getElementById(
        'incompleteStudents'
    ).textContent =
        students.incomplete || 0;


    document.getElementById(
        'notStartedStudents'
    ).textContent =
        students.notStarted || 0;


    const className =
        overview.class &&
        overview.class.className
            ? overview.class.className
            : 'Class';


    const section =
        overview.class &&
        overview.class.section
            ? ' - ' +
              overview.class.section
            : '';


    document.getElementById(
        'overviewDescription'
    ).textContent =
        className +
        section +
        ' · ' +
        overview.term;


    const badge =
        document.getElementById(
            'pdfStatusBadge'
        );


    if (
        overview.readyForPdf
    ) {

        badge.textContent =
            'Ready for PDF';

        badge.classList.add(
            'ready'
        );


        generateClassPdfButton.disabled =
            false;

    } else {

        badge.textContent =
            'Not Ready';

        badge.classList.remove(
            'ready'
        );


        generateClassPdfButton.disabled =
            true;

    }

}



/* ============================================================
   RENDER STUDENTS
============================================================ */

function renderStudents(
    students
) {

    studentsTableBody.innerHTML = '';


    if (!students.length) {

        studentsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-cell"
                >
                    No active students found.
                </td>

            </tr>

        `;

        return;

    }


    students.forEach(
        function(student, index) {

            const row =
                document.createElement(
                    'tr'
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td class="student-name">
                    ${escapeHtml(
                        student.fullName
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        student.admissionNo
                    )}
                </td>

                <td>
                    ${createStatusBadge(
                        student.completionStatus
                    )}
                </td>

                <td>
                    ${
                        student.total !== null &&
                        student.total !== undefined
                            ? escapeHtml(
                                String(
                                    student.total
                                )
                            )
                            : '—'
                    }
                </td>

                <td>
                    ${
                        student.average !== null &&
                        student.average !== undefined
                            ? escapeHtml(
                                String(
                                    student.average
                                )
                            )
                            : '—'
                    }
                </td>

                <td>
                    ${
                        student.position !== null &&
                        student.position !== undefined
                            ? escapeHtml(
                                formatPosition(
                                    student.position
                                )
                            )
                            : '—'
                    }
                </td>

                <td>

                    <button
                        type="button"
                        class="table-action"
                        data-student-id="${escapeHtmlAttribute(
                            student.studentId
                        )}"
                    >
                        View
                    </button>

                </td>

            `;


            const button =
                row.querySelector(
                    '[data-student-id]'
                );


            button.addEventListener(
                'click',
                function() {

                    openStudentResult(
                        student.studentId
                    );

                }
            );


            studentsTableBody.appendChild(
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
        String(
            status || ''
        )
        .toLowerCase()
        .replace(/\s+/g, '-');


    return `

        <span
            class="result-status ${normalized}"
        >
            ${escapeHtml(
                status || 'Not Started'
            )}
        </span>

    `;

}



/* ============================================================
   OPEN STUDENT RESULT
============================================================ */

async function openStudentResult(
    studentId
) {

    resultState.selectedStudentId =
        studentId;


    modalStudentName.textContent =
        'Loading Result...';


    modalContent.innerHTML =
        '<p>Loading student result...</p>';


    generateStudentPdfButton.disabled =
        true;


    resultModal.classList.remove(
        'hidden'
    );


    showLoading(
        'Loading student result...'
    );


    try {

        const response =
            await apiRequest(
                'getResultManagementStudent',
                {

                    schoolId:
                        resultState.schoolId,

                    sessionId:
                        resultState.sessionId,

                    term:
                        resultState.term,

                    studentId:
                        studentId

                }
            );


        if (
            !response.success ||
            !response.result
        ) {

            throw new Error(
                response.error ||
                'Could not load student result.'
            );

        }


        renderStudentResult(
            response.result
        );


        generateStudentPdfButton.disabled =
            false;


    } catch (error) {

        modalContent.innerHTML = `

            <div class="message-box error">
                ${escapeHtml(
                    error.message
                )}
            </div>

        `;

    } finally {

        hideLoading();

    }

}



/* ============================================================
   RENDER STUDENT RESULT
============================================================ */

function renderStudentResult(
    result
) {

    const student =
        result.student || {};

    const classInfo =
        result.class || {};

    const session =
        result.session || {};

    const subjects =
        result.subjects || [];

    const summary =
        result.summary || {};

    const position =
        result.position || {};

    const comments =
        result.comments || {};


    modalStudentName.textContent =
        student.fullName ||
        'Student Result';


    let subjectRows = '';


    subjects.forEach(
        function(subject) {

            subjectRows += `

                <tr>

                    <td>
                        ${escapeHtml(
                            subject.subjectName ||
                            subject.subject ||
                            ''
                        )}
                    </td>

                    <td>
                        ${displayValue(
                            subject.testScore
                        )}
                    </td>

                    <td>
                        ${displayValue(
                            subject.examScore
                        )}
                    </td>

                    <td>
                        ${displayValue(
                            subject.totalScore
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            subject.grade || ''
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            subject.remark || ''
                        )}
                    </td>

                </tr>

            `;

        }
    );


    const positionValue =
        position.position !== null &&
        position.position !== undefined
            ? formatPosition(
                position.position
            )
            : 'Not Available';


    const teacherComment =
        comments &&
        (
            comments.teacherComment ||
            comments['Teacher Comment']
        )
            ? (
                comments.teacherComment ||
                comments['Teacher Comment']
            )
            : 'No teacher comment provided.';


    const principalComment =
        comments &&
        (
            comments.principalComment ||
            comments['Principal Comment']
        )
            ? (
                comments.principalComment ||
                comments['Principal Comment']
            )
            : 'No principal comment provided.';


    modalContent.innerHTML = `

        <div class="result-info-grid">

            <div class="result-info-item">

                <span class="result-info-label">
                    Admission No.
                </span>

                <strong class="result-info-value">
                    ${escapeHtml(
                        student.admissionNo || ''
                    )}
                </strong>

            </div>


            <div class="result-info-item">

                <span class="result-info-label">
                    Class
                </span>

                <strong class="result-info-value">
                    ${escapeHtml(
                        classInfo.className || ''
                    )}
                    ${
                        classInfo.section
                            ? ' - ' +
                              escapeHtml(
                                  classInfo.section
                              )
                            : ''
                    }
                </strong>

            </div>


            <div class="result-info-item">

                <span class="result-info-label">
                    Session
                </span>

                <strong class="result-info-value">
                    ${escapeHtml(
                        session.sessionName || ''
                    )}
                </strong>

            </div>


            <div class="result-info-item">

                <span class="result-info-label">
                    Term
                </span>

                <strong class="result-info-value">
                    ${escapeHtml(
                        result.term || ''
                    )}
                </strong>

            </div>

        </div>


        <table class="result-subject-table">

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

                ${subjectRows}

            </tbody>

        </table>


        <div class="modal-summary">

            <div class="modal-summary-item">

                <span>
                    Total
                </span>

                <strong>
                    ${displayValue(
                        summary.overallTotal
                    )}
                </strong>

            </div>


            <div class="modal-summary-item">

                <span>
                    Average
                </span>

                <strong>
                    ${displayValue(
                        summary.average
                    )}
                </strong>

            </div>


            <div class="modal-summary-item">

                <span>
                    Position
                </span>

                <strong>
                    ${escapeHtml(
                        positionValue
                    )}
                </strong>

            </div>


            <div class="modal-summary-item">

                <span>
                    Status
                </span>

                <strong>
                    ${escapeHtml(
                        summary.completionStatus ||
                        'Not Started'
                    )}
                </strong>

            </div>

        </div>


        <div class="comment-block">

            <h3>
                Teacher's Comment
            </h3>

            <p>
                ${escapeHtml(
                    teacherComment
                )}
            </p>

        </div>


        <div class="comment-block">

            <h3>
                Principal's Comment
            </h3>

            <p>
                ${escapeHtml(
                    principalComment
                )}
            </p>

        </div>

    `;

}



/* ============================================================
   GENERATE STUDENT PDF
============================================================ */

async function generateSelectedStudentPdf() {

    const studentId =
        resultState.selectedStudentId;


    if (!studentId) {

        showMessage(
            'No student is selected.',
            'error'
        );

        return;

    }


    showLoading(
        'Generating student PDF...'
    );


    try {

        const response =
            await apiRequest(
                'generateStudentResultPdf',
                {

                    schoolId:
                        resultState.schoolId,

                    sessionId:
                        resultState.sessionId,

                    term:
                        resultState.term,

                    studentId:
                        studentId

                }
            );


        if (
            !response.success ||
            !response.file
        ) {

            throw new Error(
                response.error ||
                'PDF generation failed.'
            );

        }


        showMessage(
            'Student result PDF generated successfully.',
            'success'
        );


        if (
            response.file.downloadUrl
        ) {

            window.open(
                response.file.downloadUrl,
                '_blank'
            );

        } else if (
            response.file.url
        ) {

            window.open(
                response.file.url,
                '_blank'
            );

        }


    } catch (error) {

        showMessage(
            error.message,
            'error'
        );

    } finally {

        hideLoading();

    }

}



/* ============================================================
   GENERATE CLASS PDFs
============================================================ */

async function generateClassPdfs() {

    if (
        !resultState.classId
    ) {

        showMessage(
            'Please load a class first.',
            'error'
        );

        return;

    }


    const confirmed =
        window.confirm(
            'Generate PDF result files for all students in this class?'
        );


    if (!confirmed) {

        return;

    }


    showLoading(
        'Generating class result PDFs...'
    );


    try {

        const response =
            await apiRequest(
                'generateClassResultPdfs',
                {

                    schoolId:
                        resultState.schoolId,

                    sessionId:
                        resultState.sessionId,

                    term:
                        resultState.term,

                    classId:
                        resultState.classId

                }
            );


        if (
            !response.success
        ) {

            throw new Error(
                response.error ||
                'Class PDF generation failed.'
            );

        }


        let message =
            'Generated ' +
            (
                response.generatedCount ||
                0
            ) +
            ' result PDF(s).';


        if (
            response.failedCount
        ) {

            message +=
                ' ' +
                response.failedCount +
                ' student(s) failed.';

        }


        showMessage(
            message,
            response.failedCount
                ? 'error'
                : 'success'
        );


        if (
            response.folder &&
            response.folder.url
        ) {

            window.open(
                response.folder.url,
                '_blank'
            );

        }


    } catch (error) {

        showMessage(
            error.message,
            'error'
        );

    } finally {

        hideLoading();

    }

}



/* ============================================================
   MODAL EVENTS
============================================================ */

function setupModalEvents() {

    document
        .querySelectorAll(
            '[data-close-modal]'
        )
        .forEach(
            function(element) {

                element.addEventListener(
                    'click',
                    closeResultModal
                );

            }
        );


    document.addEventListener(
        'keydown',
        function(event) {

            if (
                event.key === 'Escape' &&
                !resultModal.classList.contains(
                    'hidden'
                )
            ) {

                closeResultModal();

            }

        }
    );

}



/* ============================================================
   CLOSE MODAL
============================================================ */

function closeResultModal() {

    resultModal.classList.add(
        'hidden'
    );


    resultState.selectedStudentId =
        null;

}



/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
    action,
    payload
) {

    if (
        !RESULT_API_URL ||
        RESULT_API_URL ===
            'YOUR_APPS_SCRIPT_WEB_APP_URL'
    ) {

        throw new Error(
            'Please configure your Apps Script Web App URL in result-management.js.'
        );

    }


    const body = {

        action:
            action,

        ...payload

    };


    const response =
        await fetch(
            RESULT_API_URL,
            {

                method:
                    'POST',

                headers: {

                    'Content-Type':
                        'text/plain;charset=utf-8'

                },

                body:
                    JSON.stringify(
                        body
                    )

            }
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch (error) {

        throw new Error(
            'The server returned an invalid response.'
        );

    }


    if (
        data &&
        data.success === false
    ) {

        throw new Error(
            data.error ||
            'Request failed.'
        );

    }


    return data;

}



/* ============================================================
   LOADING
============================================================ */

function showLoading(
    message
) {

    loadingText.textContent =
        message ||
        'Loading...';


    loadingOverlay.classList.remove(
        'hidden'
    );

}


function hideLoading() {

    loadingOverlay.classList.add(
        'hidden'
    );

}



/* ============================================================
   MESSAGE
============================================================ */

function showMessage(
    message,
    type
) {

    messageBox.textContent =
        message;


    messageBox.className =
        'message-box ' +
        (
            type === 'success'
                ? 'success'
                : 'error'
        );


    window.clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        window.setTimeout(
            function() {

                messageBox.className =
                    'message-box hidden';

            },
            5000
        );

}



/* ============================================================
   DISPLAY VALUE
============================================================ */

function displayValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return '—';

    }


    return escapeHtml(
        String(value)
    );

}



/* ============================================================
   POSITION
============================================================ */

function formatPosition(
    position
) {

    const number =
        Number(position);


    if (
        !isFinite(number)
    ) {

        return String(
            position
        );

    }


    const lastTwo =
        number % 100;


    if (
        lastTwo >= 11 &&
        lastTwo <= 13
    ) {

        return number + 'th';

    }


    switch (
        number % 10
    ) {

        case 1:
            return number + 'st';

        case 2:
            return number + 'nd';

        case 3:
            return number + 'rd';

        default:
            return number + 'th';

    }

}



/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(
    value
) {

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
            '&#39;'
        );

}



/* ============================================================
   ESCAPE ATTRIBUTE
============================================================ */

function escapeHtmlAttribute(
    value
) {

    return escapeHtml(
        value
    );

}
