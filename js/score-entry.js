/* =========================================================
   SCHOOL RESULTS SYSTEM
   FILE: score-entry.js
   VERSION: 1.1.0

   PURPOSE:
   - Score entry frontend
   - Loads active academic session
   - Loads active classes
   - Loads class-specific score entry setup
   - Loads students and existing scores
   - Saves scores in bulk
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

let setupData = {
    sessions: [],
    classes: [],
    subjects: [],
    assignments: []
};

let scoreRecords = [];

let currentStudents = [];

let currentSelection = {
    sessionId: '',
    term: '',
    classId: '',
    subjectId: ''
};

let isSaving = false;

let isLoadingSetup = false;


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
        user['Role'] ||
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

    if (menuButton) {

        menuButton.addEventListener(
            'click',
            toggleSidebar
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


    if (loadRecordsButton) {

        loadRecordsButton.addEventListener(
            'click',
            loadScoreRecords
        );

    }


    if (saveScoresButton) {

        saveScoresButton.addEventListener(
            'click',
            saveScores
        );

    }


    if (closeMessage) {

        closeMessage.addEventListener(
            'click',
            hideMessage
        );

    }


    if (sessionSelect) {

        sessionSelect.addEventListener(
            'change',
            handleSessionChange
        );

    }


    if (termSelect) {

        termSelect.addEventListener(
            'change',
            handleSetupChange
        );

    }


    if (classSelect) {

        classSelect.addEventListener(
            'change',
            handleClassChange
        );

    }


    if (subjectSelect) {

        subjectSelect.addEventListener(
            'change',
            handleSetupChange
        );

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    if (sidebar) {

        sidebar.classList.toggle(
            'open'
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.toggle(
            'visible'
        );

    }

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            'open'
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            'visible'
        );

    }

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
   LOAD SCORE ENTRY SETUP
=========================================================

   IMPORTANT BACKEND FLOW:

   getScoreEntrySetup requires:

   schoolId
   sessionId
   classId

   Therefore we must obtain:

   1. School ID from login session
   2. Active academic session
   3. Active classes
   4. Select a class
   5. THEN call getScoreEntrySetup
========================================================= */

async function loadScoreEntrySetup() {

    if (isLoadingSetup) {
        return;
    }


    isLoadingSetup = true;


    const schoolId =
        getSchoolId();


    if (!schoolId) {

        throw new Error(
            'School information is missing from your session.'
        );

    }


    try {

        /*
         * -------------------------------------------------
         * STEP 1
         * Load all sessions.
         * -------------------------------------------------
         */

        const sessionsResult =
            await callApi(
                'getSessions',
                {
                    schoolId
                }
            );


        setupData.sessions =
            extractCollectionFromResult(
                sessionsResult,
                [
                    'sessions',
                    'Sessions',
                    'records',
                    'data'
                ]
            );


        /*
         * -------------------------------------------------
         * STEP 2
         * Get active session.
         * -------------------------------------------------
         */

        const activeSessionResult =
            await callApi(
                'getActiveSession',
                {
                    schoolId
                }
            );


        const activeSession =
            extractActiveSession(
                activeSessionResult
            );


        if (!activeSession) {

            throw new Error(
                'No active academic session has been set for this school.'
            );

        }


        const activeSessionId =
            getField(
                activeSession,
                [
                    'Session ID',
                    'sessionId'
                ]
            );


        if (!activeSessionId) {

            throw new Error(
                'The active academic session does not have a valid Session ID.'
            );

        }


        currentSelection.sessionId =
            activeSessionId;


        /*
         * -------------------------------------------------
         * STEP 3
         * Load active classes.
         * -------------------------------------------------
         */

        const classesResult =
            await callApi(
                'getActiveClasses',
                {
                    schoolId
                }
            );


        setupData.classes =
            extractCollectionFromResult(
                classesResult,
                [
                    'classes',
                    'Classes',
                    'records',
                    'data'
                ]
            );


        if (!setupData.classes.length) {

            throw new Error(
                'No active classes were found. Please create an active class before entering scores.'
            );

        }


        /*
         * -------------------------------------------------
         * STEP 4
         * Populate session and class selectors.
         * -------------------------------------------------
         */

        populateSessions();

        sessionSelect.value =
            activeSessionId;


        populateClasses();


        /*
         * Automatically select the first active class
         * if no class has already been selected.
         */

        let selectedClassId =
            currentSelection.classId;


        if (
            !selectedClassId ||
            !setupData.classes.some(
                function (item) {

                    return String(
                        getField(
                            item,
                            [
                                'Class ID',
                                'classId'
                            ]
                        )
                    ) === String(
                        selectedClassId
                    );

                }
            )
        ) {

            const firstClass =
                setupData.classes[0];


            selectedClassId =
                getField(
                    firstClass,
                    [
                        'Class ID',
                        'classId'
                    ]
                );

        }


        if (!selectedClassId) {

            throw new Error(
                'The selected class does not have a valid Class ID.'
            );

        }


        currentSelection.classId =
            selectedClassId;


        classSelect.value =
            selectedClassId;


        /*
         * -------------------------------------------------
         * STEP 5
         * NOW call getScoreEntrySetup.
         *
         * This backend requires:
         * schoolId
         * sessionId
         * classId
         * -------------------------------------------------
         */

        await loadClassScoreEntrySetup(
            selectedClassId
        );


        updateSetupMessage();

    } finally {

        isLoadingSetup = false;

    }

}


/* =========================================================
   LOAD CLASS-SPECIFIC SETUP
========================================================= */

async function loadClassScoreEntrySetup(
    classId
) {

    const schoolId =
        getSchoolId();


    const sessionId =
        currentSelection.sessionId;


    if (!schoolId) {

        throw new Error(
            'School information is missing from your session.'
        );

    }


    if (!sessionId) {

        throw new Error(
            'Session ID is required.'
        );

    }


    if (!classId) {

        throw new Error(
            'Class ID is required.'
        );

    }


    /*
     * Show a small loading message while the
     * class-specific subjects are being retrieved.
     */

    if (setupMessage) {

        setupMessage.textContent =
            'Loading subjects for the selected class...';

        setupMessage.classList.remove(
            'hidden'
        );

    }


    const result =
        await callApi(
            'getScoreEntrySetup',
            {
                schoolId,
                sessionId,
                classId
            }
        );


    const normalized =
        normalizeSetupData(
            result
        );


    /*
     * Preserve the sessions/classes already loaded
     * because the setup endpoint may return only the
     * class-specific subjects/assignments.
     */

    if (
        normalized.sessions.length
    ) {

        setupData.sessions =
            normalized.sessions;

    }


    if (
        normalized.classes.length
    ) {

        setupData.classes =
            normalized.classes;

    }


    setupData.subjects =
        normalized.subjects;


    setupData.assignments =
        normalized.assignments;


    /*
     * Populate subjects returned for this class.
     */

    populateSubjects();


    /*
     * If there is only one subject, automatically
     * select it.
     */

    if (
        setupData.subjects.length === 1
    ) {

        const onlySubject =
            setupData.subjects[0];


        const subjectId =
            getField(
                onlySubject,
                [
                    'Subject ID',
                    'subjectId'
                ]
            );


        if (subjectId) {

            currentSelection.subjectId =
                subjectId;

            subjectSelect.value =
                subjectId;

        }

    } else {

        /*
         * If the previously selected subject is
         * not available for this class, clear it.
         */

        const stillExists =
            setupData.subjects.some(
                function (subject) {

                    const id =
                        getField(
                            subject,
                            [
                                'Subject ID',
                                'subjectId'
                            ]
                        );

                    return String(id) ===
                        String(
                            currentSelection.subjectId
                        );

                }
            );


        if (!stillExists) {

            currentSelection.subjectId =
                '';

            subjectSelect.value =
                '';

        }

    }


    clearLoadedRecords();

    updateSetupMessage();

}


/* =========================================================
   EXTRACT ACTIVE SESSION
========================================================= */

function extractActiveSession(
    result
) {

    const data =
        result?.data &&
        !Array.isArray(result.data)
            ? result.data
            : result || {};


    if (
        data.session &&
        typeof data.session === 'object'
    ) {

        return data.session;

    }


    if (
        data.activeSession &&
        typeof data.activeSession === 'object'
    ) {

        return data.activeSession;

    }


    if (
        data['Session ID'] ||
        data.sessionId
    ) {

        return data;

    }


    /*
     * Some simple Apps Script responses may return
     * the session directly inside data.
     */

    if (
        result?.data &&
        !Array.isArray(result.data) &&
        (
            result.data['Session ID'] ||
            result.data.sessionId
        )
    ) {

        return result.data;

    }


    return null;

}


/* =========================================================
   SETUP NORMALIZATION
========================================================= */

function normalizeSetupData(
    result
) {

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
                    'availableSubjects',
                    'classSubjects'
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


/* =========================================================
   GENERIC RESULT COLLECTION EXTRACTION
========================================================= */

function extractCollectionFromResult(
    result,
    names
) {

    const data =
        result?.data &&
        !Array.isArray(result.data)
            ? result.data
            : result || {};


    /*
     * First look for named collections.
     */

    const named =
        extractCollection(
            data,
            names
        );


    if (named.length) {
        return named;
    }


    /*
     * If data itself is an array.
     */

    if (
        Array.isArray(
            result?.data
        )
    ) {

        return result.data;

    }


    /*
     * If the response itself is an array.
     */

    if (
        Array.isArray(result)
    ) {

        return result;

    }


    return [];

}


function extractCollection(
    source,
    names
) {

    for (
        const name of names
    ) {

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
                getClassDisplayName(
                    item
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
   SESSION CHANGE
========================================================= */

async function handleSessionChange() {

    clearPageMessage();

    clearLoadedRecords();


    const sessionId =
        sessionSelect.value;


    currentSelection.sessionId =
        sessionId;


    currentSelection.subjectId =
        '';


    subjectSelect.innerHTML =
        '<option value="">Select subject</option>';


    if (!sessionId) {

        updateSetupMessage();

        return;

    }


    const classId =
        classSelect.value;


    if (!classId) {

        updateSetupMessage();

        return;

    }


    try {

        await loadClassScoreEntrySetup(
            classId
        );

    } catch (error) {

        console.error(
            'Session change setup error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to load score entry setup.',
            'error'
        );

    }


    updateSetupMessage();

}


/* =========================================================
   CLASS CHANGE
========================================================= */

async function handleClassChange() {

    clearPageMessage();

    clearLoadedRecords();


    const classId =
        classSelect.value;


    currentSelection.classId =
        classId;


    currentSelection.subjectId =
        '';


    subjectSelect.innerHTML =
        '<option value="">Select subject</option>';


    if (!classId) {

        updateSetupMessage();

        return;

    }


    const sessionId =
        sessionSelect.value;


    if (!sessionId) {

        updateSetupMessage();

        return;

    }


    try {

        await loadClassScoreEntrySetup(
            classId
        );

    } catch (error) {

        console.error(
            'Class change setup error:',
            error
        );


        showMessage(
            error.message ||
            'Unable to load subjects for this class.',
            'error'
        );


        subjectSelect.innerHTML =
            '<option value="">Unable to load subjects</option>';

    }


    updateSetupMessage();

}


/* =========================================================
   GENERAL SETUP CHANGE
========================================================= */

function handleSetupChange() {

    updateSetupMessage();

    clearLoadedRecords();


    currentSelection.sessionId =
        sessionSelect.value;

    currentSelection.term =
        termSelect.value;

    currentSelection.classId =
        classSelect.value;

    currentSelection.subjectId =
        subjectSelect.value;

}


/* =========================================================
   SETUP MESSAGE
========================================================= */

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

        return;

    }


    setupMessage.classList.remove(
        'hidden'
    );


    if (
        !sessionSelect.value
    ) {

        setupMessage.textContent =
            'Select an academic session.';

        return;

    }


    if (
        !termSelect.value
    ) {

        setupMessage.textContent =
            'Select a term.';

        return;

    }


    if (
        !classSelect.value
    ) {

        setupMessage.textContent =
            'Select a class.';

        return;

    }


    if (
        !subjectSelect.value
    ) {

        setupMessage.textContent =
            'Select a subject.';

        return;

    }


    setupMessage.textContent =
        'Select the session, term, class and subject, then click Load Students.';

}


/* =========================================================
   CLEAR LOADED RECORDS
========================================================= */

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

function normalizeScoreRecords(
    result
) {

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
     * If the backend returns a combined records array,
     * try to use it for both lists.
     */

    if (
        !students.length &&
        Array.isArray(data.records)
    ) {

        students =
            data.records;

    }


    if (
        !scores.length &&
        Array.isArray(data.records)
    ) {

        scores =
            data.records;

    }


    /*
     * Some backend responses may put the student list
     * directly inside data.students and the score list
     * inside data.scores, which the extraction above
     * already handles.
     */

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

                <th>#</th>

                <th>ADMISSION NO.</th>

                <th>STUDENT</th>

                <th>TEST / 40</th>

                <th>EXAM / 60</th>

                <th>TOTAL / 100</th>

                <th>STATUS</th>

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
        currentSession['User ID'] ||
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

    if (!pageMessage || !messageText) {
        return;
    }


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

    if (!pageMessage) {
        return;
    }


    pageMessage.classList.add(
        'hidden'
    );

}


function clearPageMessage() {

    if (!pageMessage) {
        return;
    }


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


    for (
        const field of fields
    ) {

        if (
            object[field] !== undefined &&
            object[field] !== null
        ) {

            return object[field];

        }

    }


    return '';

}


/* =========================================================
   CLASS DISPLAY NAME
========================================================= */

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


/* =========================================================
   FORMAT NUMBER
========================================================= */

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
        .replace(
            /\.?0+$/,
            ''
        );

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
