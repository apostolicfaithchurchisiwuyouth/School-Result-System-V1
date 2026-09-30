/* ============================================================
   SCHOOL RESULTS SYSTEM
   FILE: score-entry.js
   VERSION: 1.0.0

   PURPOSE:
   Score Entry Management frontend.
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

const SCORE_API_URL =
    'https://script.google.com/macros/s/AKfycbwJOUmxayihKhry6HSZQl-tsnzbQYM8jDkHaQ4O_CdOqpnGTOJ8bi_80EjD6lLcxqCI/exec';


/* ============================================================
   STATE
============================================================ */

const state = {

    schoolId: '',

    setup: null,

    students: [],

    currentRecords: [],

    originalScores: {},

    changedScores: {},

    selectedSessionId: '',

    selectedTerm: '',

    selectedClassId: '',

    selectedSubjectId: ''

};


/* ============================================================
   DOM
============================================================ */

const sessionSelect =
    document.getElementById('sessionSelect');

const termSelect =
    document.getElementById('termSelect');

const classSelect =
    document.getElementById('classSelect');

const subjectSelect =
    document.getElementById('subjectSelect');

const selectionMessage =
    document.getElementById('selectionMessage');

const scoreSummary =
    document.getElementById('scoreSummary');

const scorePanel =
    document.getElementById('scorePanel');

const emptyState =
    document.getElementById('emptyState');

const scoreTableBody =
    document.getElementById('scoreTableBody');

const tableTitle =
    document.getElementById('tableTitle');

const tableSubtitle =
    document.getElementById('tableSubtitle');

const tableMessage =
    document.getElementById('tableMessage');

const studentCount =
    document.getElementById('studentCount');

const completedCount =
    document.getElementById('completedCount');

const missingCount =
    document.getElementById('missingCount');

const changedCount =
    document.getElementById('changedCount');

const saveScoresBtn =
    document.getElementById('saveScoresBtn');

const clearChangesBtn =
    document.getElementById('clearChangesBtn');

const refreshBtn =
    document.getElementById('refreshBtn');

const loadingOverlay =
    document.getElementById('loadingOverlay');

const loadingText =
    document.getElementById('loadingText');


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    initialize
);


async function initialize() {

    state.schoolId =
        getSchoolId();

    if (!state.schoolId) {

        showSelectionMessage(
            'No school session was found. Please log in again.',
            'error'
        );

        disableSelectors();

        return;
    }

    bindEvents();

    await loadSetup();
}


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    sessionSelect.addEventListener(
        'change',
        handleSessionChange
    );

    termSelect.addEventListener(
        'change',
        handleTermChange
    );

    classSelect.addEventListener(
        'change',
        handleClassChange
    );

    subjectSelect.addEventListener(
        'change',
        handleSubjectChange
    );

    saveScoresBtn.addEventListener(
        'click',
        saveScores
    );

    clearChangesBtn.addEventListener(
        'click',
        clearChanges
    );

    refreshBtn.addEventListener(
        'click',
        refreshCurrentSelection
    );
}


/* ============================================================
   SCHOOL ID
============================================================ */

function getSchoolId() {

    const possibleKeys = [
        'schoolId',
        'school_id',
        'School ID',
        'schoolID',
        'currentSchoolId'
    ];

    for (const key of possibleKeys) {

        const value =
            localStorage.getItem(key);

        if (value) {
            return value.trim();
        }
    }

    return '';
}


/* ============================================================
   API
============================================================ */

async function api(action, data = {}) {

    const payload = {
        action,
        ...data
    };

    const response = await fetch(
        SCORE_API_URL,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'text/plain;charset=utf-8'
            },

            body: JSON.stringify(payload)
        }
    );

    if (!response.ok) {

        throw new Error(
            'Server request failed: ' +
            response.status
        );
    }

    const result =
        await response.json();

    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.message ||
            'The request was not successful.'
        );
    }

    return result;
}


/* ============================================================
   LOAD SETUP
============================================================ */

async function loadSetup() {

    showLoading(
        'Loading score entry setup...'
    );

    hideTable();

    try {

        const result =
            await api(
                'getScoreEntrySetup',
                {
                    schoolId:
                        state.schoolId
                }
            );

        state.setup =
            unwrapData(result);

        populateSessions();

        populateTerms();

        populateClasses();

        populateSubjects();

        clearSelectionMessage();

    } catch (error) {

        console.error(error);

        showSelectionMessage(
            error.message ||
            'Unable to load score entry setup.',
            'error'
        );

    } finally {

        hideLoading();
    }
}


/* ============================================================
   RESPONSE NORMALIZATION
============================================================ */

function unwrapData(result) {

    if (!result) {
        return {};
    }

    if (
        result.data &&
        typeof result.data === 'object'
    ) {
        return result.data;
    }

    return result;
}


/* ============================================================
   POPULATE SESSIONS
============================================================ */

function populateSessions() {

    const sessions =
        getArray(
            state.setup,
            [
                'sessions',
                'sessionList'
            ]
        );

    sessionSelect.innerHTML =
        '<option value="">Select session</option>';

    sessions.forEach(session => {

        const id =
            getValue(
                session,
                [
                    'sessionId',
                    'Session ID',
                    'id'
                ]
            );

        const name =
            getValue(
                session,
                [
                    'sessionName',
                    'Session Name',
                    'name'
                ]
            );

        if (!id) {
            return;
        }

        const option =
            document.createElement('option');

        option.value = id;

        option.textContent =
            name || id;

        sessionSelect.appendChild(option);
    });


    const activeSession =
        getValue(
            state.setup,
            [
                'activeSessionId'
            ]
        );


    if (activeSession) {

        sessionSelect.value =
            activeSession;

        state.selectedSessionId =
            activeSession;
    }
}


/* ============================================================
   POPULATE TERMS
============================================================ */

function populateTerms() {

    const terms =
        getArray(
            state.setup,
            [
                'terms'
            ]
        );

    termSelect.innerHTML =
        '<option value="">Select term</option>';


    terms.forEach(term => {

        const value =
            typeof term === 'string'
                ? term
                : getValue(
                    term,
                    [
                        'term',
                        'Term',
                        'name'
                    ]
                );

        if (!value) {
            return;
        }

        const option =
            document.createElement('option');

        option.value = value;

        option.textContent = value;

        termSelect.appendChild(option);
    });
}


/* ============================================================
   POPULATE CLASSES
============================================================ */

function populateClasses() {

    const classes =
        getArray(
            state.setup,
            [
                'classes',
                'classList'
            ]
        );

    classSelect.innerHTML =
        '<option value="">Select class</option>';


    classes.forEach(classItem => {

        const id =
            getValue(
                classItem,
                [
                    'classId',
                    'Class ID',
                    'id'
                ]
            );

        const className =
            getValue(
                classItem,
                [
                    'className',
                    'Class Name',
                    'name'
                ]
            );

        const section =
            getValue(
                classItem,
                [
                    'section',
                    'Section'
                ]
            );


        if (!id) {
            return;
        }


        const option =
            document.createElement('option');

        option.value = id;

        option.textContent =
            section
                ? `${className} - ${section}`
                : className || id;

        classSelect.appendChild(option);
    });
}


/* ============================================================
   POPULATE SUBJECTS
============================================================ */

function populateSubjects() {

    const subjects =
        getArray(
            state.setup,
            [
                'subjects',
                'subjectList'
            ]
        );

    subjectSelect.innerHTML =
        '<option value="">Select subject</option>';


    subjects.forEach(subject => {

        const id =
            getValue(
                subject,
                [
                    'subjectId',
                    'Subject ID',
                    'id'
                ]
            );

        const name =
            getValue(
                subject,
                [
                    'subjectName',
                    'Subject Name',
                    'name'
                ]
            );

        if (!id) {
            return;
        }

        const option =
            document.createElement('option');

        option.value = id;

        option.textContent =
            name || id;

        subjectSelect.appendChild(option);
    });
}


/* ============================================================
   SESSION CHANGE
============================================================ */

function handleSessionChange() {

    state.selectedSessionId =
        sessionSelect.value;

    resetScoreTable();

    clearSelectionMessage();
}


/* ============================================================
   TERM CHANGE
============================================================ */

function handleTermChange() {

    state.selectedTerm =
        termSelect.value;

    resetScoreTable();

    clearSelectionMessage();
}


/* ============================================================
   CLASS CHANGE
============================================================ */

function handleClassChange() {

    state.selectedClassId =
        classSelect.value;

    resetScoreTable();

    clearSelectionMessage();

    filterSubjectsByClass();
}


/* ============================================================
   SUBJECT CHANGE
============================================================ */

async function handleSubjectChange() {

    state.selectedSubjectId =
        subjectSelect.value;

    clearSelectionMessage();

    resetScoreTable();

    if (!hasRequiredSelection()) {
        return;
    }

    await loadScoreRecords();
}


/* ============================================================
   FILTER SUBJECTS BY ASSIGNMENT
============================================================ */

function filterSubjectsByClass() {

    const selectedClassId =
        state.selectedClassId;

    if (!selectedClassId) {
        populateSubjects();
        return;
    }


    const assignments =
        getArray(
            state.setup,
            [
                'assignments'
            ]
        );


    if (!assignments.length) {
        return;
    }


    const assignedSubjectIds =
        new Set();


    assignments.forEach(assignment => {

        const classId =
            getValue(
                assignment,
                [
                    'classId',
                    'Class ID'
                ]
            );

        const subjectId =
            getValue(
                assignment,
                [
                    'subjectId',
                    'Subject ID'
                ]
            );


        if (
            String(classId) ===
            String(selectedClassId)
        ) {

            if (subjectId) {
                assignedSubjectIds.add(
                    String(subjectId)
                );
            }
        }
    });


    if (!assignedSubjectIds.size) {
        return;
    }


    const allSubjects =
        getArray(
            state.setup,
            [
                'subjects',
                'subjectList'
            ]
        );


    subjectSelect.innerHTML =
        '<option value="">Select subject</option>';


    allSubjects.forEach(subject => {

        const id =
            getValue(
                subject,
                [
                    'subjectId',
                    'Subject ID',
                    'id'
                ]
            );


        if (
            !assignedSubjectIds.has(
                String(id)
            )
        ) {
            return;
        }


        const name =
            getValue(
                subject,
                [
                    'subjectName',
                    'Subject Name',
                    'name'
                ]
            );


        const option =
            document.createElement('option');

        option.value = id;

        option.textContent =
            name || id;

        subjectSelect.appendChild(option);
    });
}


/* ============================================================
   LOAD SCORE RECORDS
============================================================ */

async function loadScoreRecords() {

    if (!hasRequiredSelection()) {
        return;
    }


    showLoading(
        'Loading students and scores...'
    );


    try {

        const result =
            await api(
                'getScoreEntryRecords',
                {
                    schoolId:
                        state.schoolId,

                    sessionId:
                        state.selectedSessionId,

                    term:
                        state.selectedTerm,

                    classId:
                        state.selectedClassId,

                    subjectId:
                        state.selectedSubjectId
                }
            );


        const data =
            unwrapData(result);


        state.currentRecords =
            getArray(
                data,
                [
                    'students',
                    'records',
                    'scores'
                ]
            );


        state.students =
            state.currentRecords;


        state.originalScores = {};

        state.changedScores = {};


        state.currentRecords.forEach(record => {

            const studentId =
                getStudentId(record);

            if (!studentId) {
                return;
            }


            state.originalScores[studentId] =
                {
                    test:
                        normalizeNumber(
                            getValue(
                                record,
                                [
                                    'testScore',
                                    'Test Score',
                                    'test'
                                ]
                            )
                        ),

                    exam:
                        normalizeNumber(
                            getValue(
                                record,
                                [
                                    'examScore',
                                    'Exam Score',
                                    'exam'
                                ]
                            )
                        )
                };
        });


        renderScoreTable();

        showScorePanel();


    } catch (error) {

        console.error(error);

        showSelectionMessage(
            error.message ||
            'Unable to load score records.',
            'error'
        );

        hideTable();

    } finally {

        hideLoading();
    }
}


/* ============================================================
   REQUIRED SELECTION
============================================================ */

function hasRequiredSelection() {

    if (!state.selectedSessionId) {

        showSelectionMessage(
            'Please select a session.',
            'info'
        );

        return false;
    }


    if (!state.selectedTerm) {

        showSelectionMessage(
            'Please select a term.',
            'info'
        );

        return false;
    }


    if (!state.selectedClassId) {

        showSelectionMessage(
            'Please select a class.',
            'info'
        );

        return false;
    }


    if (!state.selectedSubjectId) {

        showSelectionMessage(
            'Please select a subject.',
            'info'
        );

        return false;
    }


    return true;
}


/* ============================================================
   RENDER TABLE
============================================================ */

function renderScoreTable() {

    scoreTableBody.innerHTML = '';


    if (!state.currentRecords.length) {

        const row =
            document.createElement('tr');

        row.innerHTML = `
            <td colspan="6">
                <div class="empty-state">
                    <h2>No active students found</h2>
                    <p>
                        There are no active students
                        in this class.
                    </p>
                </div>
            </td>
        `;

        scoreTableBody.appendChild(row);

        updateSummary();

        return;
    }


    state.currentRecords.forEach(
        (record, index) => {

            const studentId =
                getStudentId(record);

            const studentName =
                getValue(
                    record,
                    [
                        'fullName',
                        'Full Name',
                        'studentName',
                        'Student Name',
                        'name'
                    ]
                ) ||
                'Unnamed Student';


            const admissionNo =
                getValue(
                    record,
                    [
                        'admissionNo',
                        'Admission No',
                        'admissionNumber'
                    ]
                ) ||
                '';


            const original =
                state.originalScores[
                    studentId
                ] ||
                {
                    test: '',
                    exam: ''
                };


            const row =
                document.createElement('tr');

            row.dataset.studentId =
                studentId;


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <div class="student-name">
                        ${escapeHtml(studentName)}
                    </div>
                </td>

                <td>
                    <div class="admission-number">
                        ${escapeHtml(admissionNo)}
                    </div>
                </td>

                <td>
                    <input
                        type="number"
                        class="score-input test-input"
                        data-student-id="${escapeAttribute(studentId)}"
                        data-field="test"
                        min="0"
                        max="40"
                        step="1"
                        inputmode="numeric"
                        value="${formatInputValue(original.test)}"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        class="score-input exam-input"
                        data-student-id="${escapeAttribute(studentId)}"
                        data-field="exam"
                        min="0"
                        max="60"
                        step="1"
                        inputmode="numeric"
                        value="${formatInputValue(original.exam)}"
                    >
                </td>

                <td class="total-cell empty">
                    -
                </td>
            `;


            scoreTableBody.appendChild(row);
        }
    );


    bindScoreInputs();

    updateAllTotals();

    updateSummary();
}


/* ============================================================
   BIND INPUTS
============================================================ */

function bindScoreInputs() {

    const inputs =
        scoreTableBody.querySelectorAll(
            '.score-input'
        );


    inputs.forEach(input => {

        input.addEventListener(
            'input',
            handleScoreInput
        );

        input.addEventListener(
            'blur',
            validateInput
        );
    });
}


/* ============================================================
   SCORE INPUT
============================================================ */

function handleScoreInput(event) {

    const input =
        event.target;

    const studentId =
        input.dataset.studentId;

    const field =
        input.dataset.field;

    let value =
        input.value.trim();


    if (value === '') {

        value = '';

    } else {

        value =
            Number(value);
    }


    if (
        value !== '' &&
        Number.isNaN(value)
    ) {
        value = '';
    }


    if (
        field === 'test' &&
        value !== '' &&
        value > 40
    ) {
        value = 40;
        input.value = 40;
    }


    if (
        field === 'exam' &&
        value !== '' &&
        value > 60
    ) {
        value = 60;
        input.value = 60;
    }


    if (
        value !== '' &&
        value < 0
    ) {
        value = 0;
        input.value = 0;
    }


    if (!state.changedScores[studentId]) {

        state.changedScores[studentId] = {};
    }


    state.changedScores[studentId][field] =
        value;


    markInputChanged(
        input,
        studentId,
        field
    );


    updateRowTotal(
        input.closest('tr')
    );


    updateSummary();
}


/* ============================================================
   VALIDATE INPUT
============================================================ */

function validateInput(event) {

    const input =
        event.target;

    const field =
        input.dataset.field;

    const value =
        input.value.trim();


    input.classList.remove(
        'invalid'
    );


    if (value === '') {
        return;
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {

        input.classList.add(
            'invalid'
        );

        return;
    }


    if (
        field === 'test' &&
        (number < 0 || number > 40)
    ) {

        input.classList.add(
            'invalid'
        );

        return;
    }


    if (
        field === 'exam' &&
        (number < 0 || number > 60)
    ) {

        input.classList.add(
            'invalid'
        );
    }
}


/* ============================================================
   MARK CHANGED
============================================================ */

function markInputChanged(
    input,
    studentId,
    field
) {

    const original =
        state.originalScores[
            studentId
        ] ||
        {
            test: '',
            exam: ''
        };


    const current =
        state.changedScores[
            studentId
        ] &&
        state.changedScores[
            studentId
        ][field];


    const originalValue =
        normalizeComparable(
            original[field]
        );


    const currentValue =
        normalizeComparable(
            current
        );


    if (
        currentValue !==
        originalValue
    ) {

        input.classList.add(
            'changed'
        );

    } else {

        input.classList.remove(
            'changed'
        );
    }
}


/* ============================================================
   UPDATE ROW TOTAL
============================================================ */

function updateRowTotal(row) {

    if (!row) {
        return;
    }


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


    const test =
        parseScoreInput(
            testInput
        );

    const exam =
        parseScoreInput(
            examInput
        );


    totalCell.classList.remove(
        'complete',
        'partial',
        'empty'
    );


    if (
        test === null &&
        exam === null
    ) {

        totalCell.textContent = '-';

        totalCell.classList.add(
            'empty'
        );

        return;
    }


    const total =
        (test || 0) +
        (exam || 0);


    totalCell.textContent =
        total;


    if (
        test !== null &&
        exam !== null
    ) {

        totalCell.classList.add(
            'complete'
        );

    } else {

        totalCell.classList.add(
            'partial'
        );
    }
}


/* ============================================================
   UPDATE ALL TOTALS
============================================================ */

function updateAllTotals() {

    const rows =
        scoreTableBody.querySelectorAll(
            'tr[data-student-id]'
        );


    rows.forEach(
        updateRowTotal
    );
}


/* ============================================================
   PARSE INPUT
============================================================ */

function parseScoreInput(input) {

    if (!input) {
        return null;
    }


    const value =
        input.value.trim();


    if (value === '') {
        return null;
    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {
        return null;
    }


    return number;
}


/* ============================================================
   SAVE SCORES
============================================================ */

async function saveScores() {

    const rows =
        scoreTableBody.querySelectorAll(
            'tr[data-student-id]'
        );


    if (!rows.length) {
        return;
    }


    const scores = [];


    for (const row of rows) {

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
            parseScoreInput(
                testInput
            );

        const exam =
            parseScoreInput(
                examInput
            );


        if (
            test === null &&
            exam === null
        ) {

            continue;
        }


        if (
            test === null ||
            exam === null
        ) {

            showTableMessage(
                'Please enter both Test and Exam scores for every student whose result you want to save.',
                'error'
            );

            return;
        }


        if (
            test < 0 ||
            test > 40
        ) {

            showTableMessage(
                'A Test score must be between 0 and 40.',
                'error'
            );

            testInput.focus();

            return;
        }


        if (
            exam < 0 ||
            exam > 60
        ) {

            showTableMessage(
                'An Exam score must be between 0 and 60.',
                'error'
            );

            examInput.focus();

            return;
        }


        scores.push({

            studentId,

            testScore: test,

            examScore: exam

        });
    }


    if (!scores.length) {

        showTableMessage(
            'There are no scores to save.',
            'info'
        );

        return;
    }


    saveScoresBtn.disabled = true;

    clearChangesBtn.disabled = true;


    showLoading(
        'Saving scores...'
    );


    try {

        const result =
            await api(
                'saveBulkScores',
                {
                    schoolId:
                        state.schoolId,

                    sessionId:
                        state.selectedSessionId,

                    term:
                        state.selectedTerm,

                    classId:
                        state.selectedClassId,

                    subjectId:
                        state.selectedSubjectId,

                    scores
                }
            );


        const data =
            unwrapData(result);


        const savedCount =
            Number(
                getValue(
                    data,
                    [
                        'savedCount'
                    ]
                ) || 0
            );


        const failedCount =
            Number(
                getValue(
                    data,
                    [
                        'failedCount'
                    ]
                ) || 0
            );


        if (
            failedCount > 0
        ) {

            showTableMessage(
                `${savedCount} score(s) saved. ${failedCount} score(s) could not be saved.`,
                'error'
            );

        } else {

            showTableMessage(
                `${savedCount} score(s) saved successfully.`,
                'success'
            );
        }


        await loadScoreRecords();


    } catch (error) {

        console.error(error);

        showTableMessage(
            error.message ||
            'Unable to save scores.',
            'error'
        );

    } finally {

        hideLoading();

        updateSummary();
    }
}


/* ============================================================
   CLEAR CHANGES
============================================================ */

function clearChanges() {

    const confirmed =
        window.confirm(
            'Clear all unsaved changes?'
        );


    if (!confirmed) {
        return;
    }


    state.changedScores = {};


    const rows =
        scoreTableBody.querySelectorAll(
            'tr[data-student-id]'
        );


    rows.forEach(row => {

        const studentId =
            row.dataset.studentId;


        const original =
            state.originalScores[
                studentId
            ] ||
            {
                test: '',
                exam: ''
            };


        const testInput =
            row.querySelector(
                '.test-input'
            );

        const examInput =
            row.querySelector(
                '.exam-input'
            );


        testInput.value =
            formatInputValue(
                original.test
            );

        examInput.value =
            formatInputValue(
                original.exam
            );


        testInput.classList.remove(
            'changed',
            'invalid'
        );

        examInput.classList.remove(
            'changed',
            'invalid'
        );


        updateRowTotal(row);
    });


    updateSummary();

    showTableMessage(
        'Unsaved changes have been cleared.',
        'info'
    );
}


/* ============================================================
   REFRESH CURRENT SELECTION
============================================================ */

async function refreshCurrentSelection() {

    if (
        hasRequiredSelection()
    ) {

        await loadScoreRecords();

    } else {

        await loadSetup();
    }
}


/* ============================================================
   SUMMARY
============================================================ */

function updateSummary() {

    const rows =
        scoreTableBody.querySelectorAll(
            'tr[data-student-id]'
        );


    let completed = 0;

    let missing = 0;


    rows.forEach(row => {

        const testInput =
            row.querySelector(
                '.test-input'
            );

        const examInput =
            row.querySelector(
                '.exam-input'
            );


        const test =
            parseScoreInput(
                testInput
            );

        const exam =
            parseScoreInput(
                examInput
            );


        if (
            test !== null &&
            exam !== null
        ) {

            completed++;

        } else {

            missing++;
        }
    });


    const changed =
        countChangedStudents();


    studentCount.textContent =
        rows.length;

    completedCount.textContent =
        completed;

    missingCount.textContent =
        missing;

    changedCount.textContent =
        changed;


    saveScoresBtn.disabled =
        changed === 0;

    clearChangesBtn.disabled =
        changed === 0;
}


/* ============================================================
   COUNT CHANGED STUDENTS
============================================================ */

function countChangedStudents() {

    let count = 0;


    Object.keys(
        state.changedScores
    ).forEach(studentId => {

        const changes =
            state.changedScores[
                studentId
            ];


        if (!changes) {
            return;
        }


        const original =
            state.originalScores[
                studentId
            ] ||
            {
                test: '',
                exam: ''
            };


        const testChanged =
            normalizeComparable(
                changes.test
            ) !==
            normalizeComparable(
                original.test
            );


        const examChanged =
            normalizeComparable(
                changes.exam
            ) !==
            normalizeComparable(
                original.exam
            );


        if (
            testChanged ||
            examChanged
        ) {

            count++;
        }
    });


    return count;
}


/* ============================================================
   SHOW / HIDE TABLE
============================================================ */

function showScorePanel() {

    scorePanel.classList.remove(
        'hidden'
    );

    scoreSummary.classList.remove(
        'hidden'
    );

    emptyState.classList.add(
        'hidden'
    );


    const subjectName =
        subjectSelect.options[
            subjectSelect.selectedIndex
        ]?.textContent ||
        'Subject';


    const className =
        classSelect.options[
            classSelect.selectedIndex
        ]?.textContent ||
        'Class';


    tableTitle.textContent =
        `${subjectName} — ${className}`;


    tableSubtitle.textContent =
        `${state.selectedTerm} • Test / 40 • Exam / 60 • Total / 100`;
}


function hideTable() {

    scorePanel.classList.add(
        'hidden'
    );

    scoreSummary.classList.add(
        'hidden'
    );

    emptyState.classList.remove(
        'hidden'
    );
}


function resetScoreTable() {

    state.currentRecords = [];

    state.originalScores = {};

    state.changedScores = {};

    scoreTableBody.innerHTML = '';

    hideTable();

    clearTableMessage();

    updateSummary();
}


/* ============================================================
   MESSAGES
============================================================ */

function showSelectionMessage(
    message,
    type = 'info'
) {

    selectionMessage.textContent =
        message;

    selectionMessage.className =
        `selection-message ${type}`;
}


function clearSelectionMessage() {

    selectionMessage.textContent = '';

    selectionMessage.className =
        'selection-message hidden';
}


function showTableMessage(
    message,
    type = 'info'
) {

    tableMessage.textContent =
        message;

    tableMessage.className =
        `table-message ${type}`;
}


function clearTableMessage() {

    tableMessage.textContent = '';

    tableMessage.className =
        'table-message hidden';
}


/* ============================================================
   LOADING
============================================================ */

function showLoading(message) {

    loadingText.textContent =
        message || 'Loading...';

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
   DISABLE SELECTORS
============================================================ */

function disableSelectors() {

    sessionSelect.disabled = true;

    termSelect.disabled = true;

    classSelect.disabled = true;

    subjectSelect.disabled = true;
}


/* ============================================================
   HELPERS
============================================================ */

function getArray(
    object,
    keys
) {

    if (!object) {
        return [];
    }


    for (const key of keys) {

        if (
            Array.isArray(
                object[key]
            )
        ) {

            return object[key];
        }
    }


    return [];
}


function getValue(
    object,
    keys
) {

    if (!object) {
        return '';
    }


    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            return object[key];
        }
    }


    return '';
}


function getStudentId(record) {

    return String(
        getValue(
            record,
            [
                'studentId',
                'Student ID',
                'id'
            ]
        ) || ''
    ).trim();
}


function normalizeNumber(value) {

    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {
        return '';
    }


    const number =
        Number(value);


    return Number.isNaN(
        number
    )
        ? ''
        : number;
}


function normalizeComparable(value) {

    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {
        return '';
    }


    const number =
        Number(value);


    if (
        !Number.isNaN(number)
    ) {
        return number;
    }


    return String(value)
        .trim();
}


function formatInputValue(value) {

    if (
        value === '' ||
        value === null ||
        value === undefined
    ) {
        return '';
    }


    return String(value);
}


function escapeHtml(value) {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function escapeAttribute(value) {

    return escapeHtml(value);
}
