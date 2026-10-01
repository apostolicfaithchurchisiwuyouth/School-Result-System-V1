/* =========================================================
   SCHOOL RESULTS SYSTEM
   FILE: score-entry.js
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

let setupData = null;

let scoreRecords = [];

let currentStudents = [];

let currentSelection = {

    sessionId: '',
    term: '',
    classId: '',
    subjectId: ''

};

let isSaving = false;


/* =========================================================
   DOM
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

const sessionSelect =
    document.getElementById('sessionSelect');

const termSelect =
    document.getElementById('termSelect');

const classSelect =
    document.getElementById('classSelect');

const subjectSelect =
    document.getElementById('subjectSelect');

const loadRecordsButton =
    document.getElementById('loadRecordsButton');

const setupMessage =
    document.getElementById('setupMessage');

const pageMessage =
    document.getElementById('pageMessage');

const messageText =
    document.getElementById('messageText');

const closeMessage =
    document.getElementById('closeMessage');

const scoreSummary =
    document.getElementById('scoreSummary');

const studentCount =
    document.getElementById('studentCount');

const enteredCount =
    document.getElementById('enteredCount');

const missingCount =
    document.getElementById('missingCount');

const summarySubject =
    document.getElementById('summarySubject');

const tableWrapper =
    document.getElementById('tableWrapper');

const saveScoresButton =
    document.getElementById('saveScoresButton');


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    initializeScoreEntry
);


async function initializeScoreEntry() {

    currentSession =
        loadSession();


    if (!currentSession) {

        redirectToLogin();

        return;

    }


    populateUserInterface();

    setupEventListeners();


    try {

        await loadScoreEntrySetup();

    } catch (error) {

        console.error(
            'Score entry setup error:',
            error
        );

        showMessage(
            error.message ||
            'Unable to load score entry setup.',
            'error'
        );

        renderErrorState(
            error.message ||
            'Unable to load score entry setup.'
        );

    }

}


/* =========================================================
   SESSION
========================================================= */

function loadSession() {

    try {

        const saved =
            localStorage.getItem(
                SESSION_KEY
            );


        if (!saved) {
            return null;
        }


        return JSON.parse(saved);

    } catch (error) {

        console.error(
            'Session error:',
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
        String(name || '').trim();


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


    loadRecordsButton.addEventListener(
        'click',
        loadScoreRecords
    );


    saveScoresButton.addEventListener(
        'click',
        saveScores
    );


    closeMessage.addEventListener(
        'click',
        hideMessage
    );


    sessionSelect.addEventListener(
        'change',
        handleSetupChange
    );


    termSelect.addEventListener(
        'change',
        handleSetupChange
    );


    classSelect.addEventListener(
        'change',
        handleSetupChange
    );


    subjectSelect.addEventListener(
        'change',
        handleSetupChange
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


    const text =
        await response.text();


    let result;


    try {

        result =
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
   LOAD SETUP
========================================================= */

async function loadScoreEntrySetup() {

    const schoolId =
        getSchoolId();


    if (!schoolId) {

        throw new Error(
            'School information is missing from your session.'
        );

    }


    const result =
        await callApi(
            'getScoreEntrySetup',
            {
                schoolId
            }
        );


    setupData =
        normalizeSetupData(result);


    populateSessions();

    populateClasses();

    populateSubjects();


    const activeSession =
        findActiveSession();


    if (activeSession) {

        const sessionId =
            getField(
                activeSession,
                [
                    'Session ID',
                    'sessionId'
                ]
            );


        if (sessionId) {

            sessionSelect.value =
                sessionId;

        }

    }


    updateSetupMessage();

}


/* =========================================================
   SETUP NORMALIZATION
========================================================= */

function normalizeSetupData(result) {

    const data =
        result?.data &&
        !Array.isArray(result.data)
            ? result.data
            : result || {};


    return {

        sessions:
            extractCollection(
                data,
                [
                    'sessions',
                    'Sessions',
                    'availableSessions'
                ]
            ),

        classes:
            extractCollection(
                data,
                [
                    'classes',
                    'Classes',
                    'availableClasses'
                ]
            ),

        subjects:
            extractCollection(
                data,
                [
                    'subjects',
                    'Subjects',
                    'availableSubjects'
                ]
            ),

        assignments:
            extractCollection(
                data,
                [
                    'assignments',
                    'Assignments',
                    'teacherAssignments'
                ]
            )

    };

}


function extractCollection(
    source,
    names
) {

    for (const name of names) {

        if (
            Array.isArray(
                source?.[name]
            )
        ) {

            return source[name];

        }

    }


    return [];

}


/* =========================================================
   POPULATE SESSIONS
========================================================= */

function populateSessions() {

    const sessions =
        setupData?.sessions || [];


    sessionSelect.innerHTML =
        '<option value="">Select session</option>';


    sessions.forEach(
        function (session) {

            const id =
                getField(
                    session,
                    [
                        'Session ID',
                        'sessionId'
                    ]
                );


            const name =
                getField(
                    session,
                    [
                        'Session Name',
                        'sessionName'
                    ]
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
                name || id;


            sessionSelect.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   POPULATE CLASSES
========================================================= */

function populateClasses() {

    const classes =
        setupData?.classes || [];


    classSelect.innerHTML =
        '<option value="">Select class</option>';


    classes.forEach(
        function (item) {

            const id =
                getField(
                    item,
                    [
                        'Class ID',
                        'classId'
                    ]
                );


            const name =
                getClassDisplayName(item);


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
                name || id;


            classSelect.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   POPULATE SUBJECTS
========================================================= */

function populateSubjects() {

    const subjects =
        setupData?.subjects || [];


    subjectSelect.innerHTML =
        '<option value="">Select subject</option>';


    subjects.forEach(
        function (subject) {

            const id =
                getField(
                    subject,
                    [
                        'Subject ID',
                        'subjectId'
                    ]
                );


            const name =
                getField(
                    subject,
                    [
                        'Subject Name',
                        'subjectName'
                    ]
                );


            const code =
                getField(
                    subject,
                    [
                        'Subject Code',
                        'subjectCode'
                    ]
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
                code
                    ? `${name} (${code})`
                    : name || id;


            subjectSelect.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   ACTIVE SESSION
========================================================= */

function findActiveSession() {

    return (
        setupData?.sessions || []
    ).find(
        function (session) {

            const status =
                getField(
                    session,
                    [
                        'Status',
                        'status'
                    ]
                );


            return (
                String(status || '')
                    .trim()
                    .toLowerCase() ===
                'active'
            );

        }
    ) || null;

}


/* =========================================================
   SETUP CHANGE
========================================================= */

function handleSetupChange() {

    updateSetupMessage();

    clearLoadedRecords();

}


function updateSetupMessage() {

    const complete =
        Boolean(
            sessionSelect.value &&
            termSelect.value &&
            classSelect.value &&
            subjectSelect.value
        );


    if (complete) {

        setupMessage.classList.add(
            'hidden'
        );

    } else {

        setupMessage.classList.remove(
            'hidden'
        );

    }

}


function clearLoadedRecords() {

    currentStudents = [];

    scoreRecords = [];


    scoreSummary.classList.add(
        'hidden'
    );


    saveScoresButton.disabled =
        true;


    tableWrapper.innerHTML = `

        <div class="empty-state">

            <strong>
                No students loaded
            </strong>

            <span>
                Select the session, term, class and subject,
                then click Load Students.
            </span>

        </div>

    `;

}


/* =========================================================
   LOAD SCORE RECORDS
========================================================= */

async function loadScoreRecords() {

    clearPageMessage();


    const sessionId =
        sessionSelect.value;

    const term =
        termSelect.value;

    const classId =
        classSelect.value;

    const subjectId =
        subjectSelect.value;


    if (
        !sessionId ||
        !term ||
        !classId ||
        !subjectId
    ) {

        setupMessage.textContent =
            'Please select a session, term, class and subject before loading students.';

        setupMessage.classList.remove(
            'hidden'
        );

        return;

    }


    currentSelection = {

        sessionId,
        term,
        classId,
        subjectId

    };


    loadRecordsButton.disabled =
        true;


    loadRecordsButton.textContent =
        'Loading...';


    renderLoadingState();


    try {

        const result =
            await callApi(
                'getScoreEntryRecords',
                {
                    schoolId:
                        getSchoolId(),

                    sessionId,

                    term,

                    classId,

                    subjectId
                }
            );


        const normalized =
            normalizeScoreRecords(
                result
            );


        currentStudents =
            normalized.students;


        scoreRecords =
            normalized.scores;


        renderScoreTable();

        updateSummary();


        if (!currentStudents.length) {

            showMessage(
                'No active students were found in this class.',
                'error'
            );

        }

    } catch (error) {

        console.error(
            'Load score records error:',
            error
        );

        renderErrorState(
            error.message ||
            'Unable to load score records.'
        );


        showMessage(
            error.message ||
            'Unable to load score records.',
            'error'
        );

    } finally {

        loadRecordsButton.disabled =
            false;

        loadRecordsButton.textContent =
            'Load Students';

    }

}


/* =========================================================
   NORMALIZE SCORE RESPONSE
========================================================= */

function normalizeScoreRecords(result) {

    const data =
        result?.data &&
        !Array.isArray(result.data)
            ? result.data
            : result || {};


    let students =
        extractCollection(
            data,
            [
                'students',
                'Students',
                'records'
            ]
        );


    let scores =
        extractCollection(
            data,
            [
                'scores',
                'Scores',
                'scoreRecords'
            ]
        );


    /*
     * Some backend responses may return one combined
     * records array containing student + score information.
     */
    if (
        !students.length &&
        Array.isArray(data.records)
    ) {

        students =
            data.records;

        scores =
            data.records;

    }


    return {
        students,
        scores
    };

}


/* =========================================================
   FIND SCORE FOR STUDENT
========================================================= */

function getStudentScore(
    studentId
) {

    return scoreRecords.find(
        function (score) {

            const id =
                getField(
                    score,
                    [
                        'Student ID',
                        'studentId'
                    ]
                );


            return (
                String(id) ===
                String(studentId)
            );

        }
    ) || null;

}


/* =========================================================
   RENDER SCORE TABLE
========================================================= */

function renderScoreTable() {

    if (!currentStudents.length) {

        tableWrapper.innerHTML = `

            <div class="empty-state">

                <strong>
                    No students found
                </strong>

                <span>
                    There are no active students available
                    for the selected class.
                </span>

            </div>

        `;

        saveScoresButton.disabled =
            true;

        return;

    }


    const table =
        document.createElement(
            'table'
        );


    table.className =
        'score-table';


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
                    STUDENT
                </th>

                <th>
                    TEST / 40
                </th>

                <th>
                    EXAM / 60
                </th>

                <th>
                    TOTAL / 100
                </th>

                <th>
                    STATUS
                </th>

            </tr>

        </thead>

        <tbody></tbody>

    `;


    const tbody =
        table.querySelector(
            'tbody'
        );


    currentStudents.forEach(
        function (student, index) {

            const studentId =
                getField(
                    student,
                    [
                        'Student ID',
                        'studentId'
                    ]
                );


            const admissionNo =
                getField(
                    student,
                    [
                        'Admission No',
                        'admissionNo',
                        'Admission Number'
                    ]
                );


            const fullName =
                getField(
                    student,
                    [
                        'Full Name',
                        'fullName',
                        'Student Name',
                        'studentName'
                    ]
                );


            const existing =
                getStudentScore(
                    studentId
                );


            const testScore =
                getScoreValue(
                    existing,
                    [
                        'Test Score',
                        'testScore'
                    ]
                );


            const examScore =
                getScoreValue(
                    existing,
                    [
                        'Exam Score',
                        'examScore'
                    ]
                );


            const row =
                document.createElement(
                    'tr'
                );


            row.dataset.studentId =
                studentId;


            row.innerHTML = `

                <td class="student-number">
                    ${index + 1}
                </td>

                <td class="admission-cell">
                    ${escapeHtml(admissionNo)}
                </td>

                <td class="student-name">
                    ${escapeHtml(fullName)}
                </td>

                <td>

                    <input
                        type="number"
                        class="score-input test-input"
                        data-student-id="${escapeHtml(studentId)}"
                        value="${formatInputScore(testScore)}"
                        min="0"
                        max="40"
                        step="0.01"
                        placeholder="0–40"
                        aria-label="Test score for ${escapeHtml(fullName)}"
                    >

                </td>

                <td>

                    <input
                        type="number"
                        class="score-input exam-input"
                        data-student-id="${escapeHtml(studentId)}"
                        value="${formatInputScore(examScore)}"
                        min="0"
                        max="60"
                        step="0.01"
                        placeholder="0–60"
                        aria-label="Exam score for ${escapeHtml(fullName)}"
                    >

                </td>

                <td class="total-cell">
                    —
                </td>

                <td class="status-cell">
                    —
                </td>

            `;


            const testInput =
                row.querySelector(
                    '.test-input'
                );


            const examInput =
                row.querySelector(
                    '.exam-input'
                );


            testInput.addEventListener(
                'input',
                function () {

                    validateAndUpdateRow(
                        row
                    );

                }
            );


            examInput.addEventListener(
                'input',
                function () {

                    validateAndUpdateRow(
                        row
                    );

                }
            );


            testInput.addEventListener(
                'blur',
                function () {

                    normalizeInputValue(
                        testInput,
                        40
                    );

                    validateAndUpdateRow(
                        row
                    );

                }
            );


            examInput.addEventListener(
                'blur',
                function () {

                    normalizeInputValue(
                        examInput,
                        60
                    );

                    validateAndUpdateRow(
                        row
                    );

                }
            );


            tbody.appendChild(
                row
            );


            validateAndUpdateRow(
                row
            );

        }
    );


    tableWrapper.innerHTML =
        '';


    tableWrapper.appendChild(
        table
    );


    scoreSummary.classList.remove(
        'hidden'
    );


    saveScoresButton.disabled =
        false;

}


/* =========================================================
   SCORE VALUE
========================================================= */

function getScoreValue(
    record,
    fields
) {

    if (!record) {
        return '';
    }


    const value =
        getField(
            record,
            fields
        );


    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return value;

}


function formatInputScore(
    value
) {

    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {

        return '';

    }


    const number =
        Number(value);


    return Number.isNaN(number)
        ? ''
        : number;

}


/* =========================================================
   ROW VALIDATION
========================================================= */

function validateAndUpdateRow(
    row
) {

    const testInput =
        row.querySelector(
            '.test-input'
        );

    const examInput =
        row.querySelector(
            '.exam-input'
        );

    const totalCell =
        row.querySelector(
            '.total-cell'
        );

    const statusCell =
        row.querySelector(
            '.status-cell'
        );


    const testValue =
        parseOptionalNumber(
            testInput.value
        );


    const examValue =
        parseOptionalNumber(
            examInput.value
        );


    testInput.classList.remove(
        'invalid'
    );

    examInput.classList.remove(
        'invalid'
    );


    let invalid =
        false;


    if (
        testInput.value !== '' &&
        (
            testValue === null ||
            testValue < 0 ||
            testValue > 40
        )
    ) {

        testInput.classList.add(
            'invalid'
        );

        invalid = true;

    }


    if (
        examInput.value !== '' &&
        (
            examValue === null ||
            examValue < 0 ||
            examValue > 60
        )
    ) {

        examInput.classList.add(
            'invalid'
        );

        invalid = true;

    }


    if (
        testInput.value !== '' &&
        examInput.value !== '' &&
        !invalid
    ) {

        const total =
            testValue +
            examValue;


        totalCell.textContent =
            formatNumber(total);


        totalCell.classList.remove(
            'missing'
        );


        totalCell.classList.add(
            'complete'
        );


        statusCell.innerHTML =
            '<span class="row-status complete">Complete</span>';

    } else {

        totalCell.textContent =
            '—';


        totalCell.classList.remove(
            'complete'
        );


        totalCell.classList.add(
            'missing'
        );


        if (invalid) {

            statusCell.innerHTML =
                '<span class="row-status missing">Invalid</span>';

        } else {

            statusCell.innerHTML =
                '<span class="row-status missing">Missing</span>';

        }

    }


    updateSummary();

}


/* =========================================================
   INPUT NORMALIZATION
========================================================= */

function normalizeInputValue(
    input,
    maximum
) {

    if (input.value === '') {
        return;
    }


    const number =
        Number(input.value);


    if (Number.isNaN(number)) {

        input.value =
            '';

        return;

    }


    if (number < 0) {

        input.value =
            '0';

        return;

    }


    if (number > maximum) {

        input.value =
            maximum;

    }

}


/* =========================================================
   PARSE OPTIONAL NUMBER
========================================================= */

function parseOptionalNumber(
    value
) {

    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary() {

    const rows =
        Array.from(
            tableWrapper.querySelectorAll(
                'tbody tr'
            )
        );


    if (!rows.length) {

        studentCount.textContent =
            '0';

        enteredCount.textContent =
            '0';

        missingCount.textContent =
            '0';

        summarySubject.textContent =
            getSelectedSubjectName();

        return;

    }


    let entered =
        0;


    let missing =
        0;


    rows.forEach(
        function (row) {

            const testInput =
                row.querySelector(
                    '.test-input'
                );

            const examInput =
                row.querySelector(
                    '.exam-input'
                );


            const test =
                parseOptionalNumber(
                    testInput?.value
                );


            const exam =
                parseOptionalNumber(
                    examInput?.value
                );


            const complete =
                test !== null &&
                exam !== null &&
                test >= 0 &&
                test <= 40 &&
                exam >= 0 &&
                exam <= 60;


            if (complete) {

                entered++;

            } else {

                missing++;

            }

        }
    );


    studentCount.textContent =
        rows.length;


    enteredCount.textContent =
        entered;


    missingCount.textContent =
        missing;


    summarySubject.textContent =
        getSelectedSubjectName();

}


/* =========================================================
   SELECTED SUBJECT NAME
========================================================= */

function getSelectedSubjectName() {

    const option =
        subjectSelect.options[
            subjectSelect.selectedIndex
        ];


    if (
        !option ||
        !subjectSelect.value
    ) {

        return '—';

    }


    return option.textContent;

}


/* =========================================================
   SAVE SCORES
========================================================= */

async function saveScores() {

    if (isSaving) {
        return;
    }


    const rows =
        Array.from(
            tableWrapper.querySelectorAll(
                'tbody tr'
            )
        );


    if (!rows.length) {

        showMessage(
            'There are no students to save.',
            'error'
        );

        return;

    }


    const scorePayload =
        [];


    let hasInvalid =
        false;


    let hasMissing =
        false;


    rows.forEach(
        function (row) {

            const studentId =
                row.dataset.studentId;


            const testInput =
                row.querySelector(
                    '.test-input'
                );

            const examInput =
                row.querySelector(
                    '.exam-input'
                );


            const test =
                parseOptionalNumber(
                    testInput.value
                );


            const exam =
                parseOptionalNumber(
                    examInput.value
                );


            const testProvided =
                testInput.value !== '';


            const examProvided =
                examInput.value !== '';


            if (
                testProvided &&
                (
                    test === null ||
                    test < 0 ||
                    test > 40
                )
            ) {

                hasInvalid =
                    true;

                return;

            }


            if (
                examProvided &&
                (
                    exam === null ||
                    exam < 0 ||
                    exam > 60
                )
            ) {

                hasInvalid =
                    true;

                return;

            }


            /*
             * The backend accepts the score rows.
             * Blank values are retained as blanks so the
             * backend can enforce its own score rules.
             */
            if (
                !testProvided ||
                !examProvided
            ) {

                hasMissing =
                    true;

            }


            scorePayload.push({

                studentId,

                testScore:
                    testProvided
                        ? test
                        : '',

                examScore:
                    examProvided
                        ? exam
                        : ''

            });

        }
    );


    if (hasInvalid) {

        showMessage(
            'Please correct the highlighted scores before saving.',
            'error'
        );

        return;

    }


    if (hasMissing) {

        const proceed =
            window.confirm(
                'Some students do not have both Test and Exam scores. Do you want to continue saving the entered scores?'
            );


        if (!proceed) {
            return;
        }

    }


    isSaving =
        true;


    saveScoresButton.disabled =
        true;


    saveScoresButton.textContent =
        'Saving...';


    try {

        const result =
            await callApi(
                'saveBulkScores',
                {
                    schoolId:
                        getSchoolId(),

                    sessionId:
                        currentSelection.sessionId,

                    term:
                        currentSelection.term,

                    classId:
                        currentSelection.classId,

                    subjectId:
                        currentSelection.subjectId,

                    scores:
                        scorePayload,

                    enteredBy:
                        getCurrentUserId()
                }
            );


        const message =
            result?.message ||
            result?.data?.message ||
            'Scores saved successfully.';


        showMessage(
            message,
            'success'
        );


        await loadScoreRecords();

    } catch (error) {

        console.error(
            'Save scores error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to save scores.',
            'error'
        );

    } finally {

        isSaving =
            false;


        saveScoresButton.disabled =
            false;


        saveScoresButton.textContent =
            'Save Scores';

    }

}


/* =========================================================
   CURRENT USER ID
========================================================= */

function getCurrentUserId() {

    const user =
        currentSession?.user || {};


    return (
        user.userId ||
        user['User ID'] ||
        currentSession.userId ||
        ''
    );

}


/* =========================================================
   LOADING STATE
========================================================= */

function renderLoadingState() {

    tableWrapper.innerHTML = `

        <div class="loading-state">

            <div class="spinner"></div>

            <span>
                Loading students and scores...
            </span>

        </div>

    `;


    scoreSummary.classList.add(
        'hidden'
    );


    saveScoresButton.disabled =
        true;

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
                Unable to load score entry
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;


    scoreSummary.classList.add(
        'hidden'
    );


    saveScoresButton.disabled =
        true;

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


function clearPageMessage() {

    pageMessage.classList.add(
        'hidden'
    );

}


/* =========================================================
   FIELD HELPERS
========================================================= */

function getField(
    object,
    fields
) {

    if (!object) {
        return '';
    }


    for (const field of fields) {

        if (
            object[field] !== undefined &&
            object[field] !== null
        ) {

            return object[field];

        }

    }


    return '';

}


function getClassDisplayName(
    classRecord
) {

    const name =
        getField(
            classRecord,
            [
                'Class Name',
                'className'
            ]
        );


    const section =
        getField(
            classRecord,
            [
                'Section',
                'section'
            ]
        );


    if (
        name &&
        section
    ) {

        return `${name} - ${section}`;

    }


    return name || '';

}


function formatNumber(
    number
) {

    if (
        Number.isInteger(number)
    ) {

        return String(number);

    }


    return Number(number)
        .toFixed(2)
        .replace(/\.?0+$/, '');

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
