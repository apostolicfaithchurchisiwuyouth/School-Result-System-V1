/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: result-management.js
 * VERSION: 1.3.0
 *
 * PURPOSE:
 * Result Management frontend.
 *
 * FEATURES:
 * - Load school result management setup
 * - Select session, term and class
 * - Show result overview
 * - Show completion status
 * - Show validation/readiness
 * - List students
 * - Show individual final result
 * - Load teacher/principal comments
 * - Create/update result comments
 * - Generate individual student result PDF
 * - Persistent login session
 * - Logout
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
   GLOBAL STATE 
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
 
document.addEventListener( 
    'DOMContentLoaded', 
    function () { 
 
        initializePage(); 
 
    } 
); 
 
 
/* ============================================================ 
   INITIALIZE PAGE 
============================================================ */ 
 
function initializePage() { 
 
    currentSession = 
        getStoredSession(); 
 
    if (!currentSession) { 
 
        redirectToLogin(); 
 
        return; 
 
    } 
 
    setupUserInterface(); 
 
    bindEvents(); 
 
    loadSetup(); 
 
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
 
        const parsed = 
            JSON.parse(raw); 
 
        return normalizeSession( 
            parsed 
        ); 
 
    } catch (error) { 
 
        console.error( 
            'Session read error:', 
            error 
        ); 
 
        return null; 
 
    } 
 
} 
 
 
/* ============================================================ 
   NORMALIZE SESSION 
============================================================ */ 
 
function normalizeSession(data) { 
 
    if (!data) { 
        return null; 
    } 
 
    const user = 
        data.user || 
        {}; 
 
    const school = 
        data.school || 
        {}; 
 
    const schoolId = 
        data.schoolId || 
        school.schoolId || 
        school['School ID'] || 
        user.schoolId || 
        user['School ID'] || 
        ''; 
 
    if (!schoolId) { 
        return null; 
    } 
 
    return { 
 
        schoolId: 
            schoolId, 
 
        schoolName: 
            data.schoolName || 
            school.schoolName || 
            school['School Name'] || 
            '', 
 
        schoolCode: 
            data.schoolCode || 
            school.schoolCode || 
            school['School Code'] || 
            '', 
 
        userId: 
            data.userId || 
            user.userId || 
            user['User ID'] || 
            '', 
 
        fullName: 
            data.fullName || 
            user.fullName || 
            user['Full Name'] || 
            '', 
 
        email: 
            data.email || 
            user.email || 
            user['Email'] || 
            '', 
 
        role: 
            data.role || 
            user.role || 
            user['Role'] || 
            '', 
 
        plan: 
            data.plan || 
            school.plan || 
            school['Plan'] || 
            '', 
 
        status: 
            data.status || 
            school.status || 
            school['Status'] || 
            '', 
 
        expiryDate: 
            data.expiryDate || 
            school.expiryDate || 
            school['Expiry Date'] || 
            '' 
 
    }; 
 
} 
 
 
/* ============================================================ 
   REDIRECT TO LOGIN 
============================================================ */ 
 
function redirectToLogin() { 
 
    window.location.href = 
        'index.html'; 
 
} 
 
 
/* ============================================================ 
   USER INTERFACE 
============================================================ */ 
 
function setupUserInterface() { 
 
    setText( 
        'schoolName', 
        currentSession.schoolName || 
        'School Results System' 
    ); 
 
    setText( 
        'userName', 
        currentSession.fullName || 
        'User' 
    ); 
 
    setText( 
        'userRole', 
        currentSession.role || 
        '' 
    ); 
 
    const initials = 
        getInitials( 
            currentSession.fullName || 
            currentSession.schoolName || 
            'User' 
        ); 
 
    setText( 
        'userInitials', 
        initials 
    ); 
 
} 
 
 
/* ============================================================ 
   BIND EVENTS 
============================================================ */ 
 
function bindEvents() { 
 
    const menuButton = 
        document.getElementById( 
            'menuButton' 
        ); 
 
    const sidebar = 
        document.getElementById( 
            'sidebar' 
        ); 
 
    if ( 
        menuButton && 
        sidebar 
    ) { 
 
        menuButton.addEventListener( 
            'click', 
            function () { 
 
                sidebar.classList.toggle( 
                    'open' 
                ); 
 
            } 
        ); 
 
    } 
 
 
    const logoutButton = 
        document.getElementById( 
            'logoutButton' 
        ); 
 
    if (logoutButton) { 
 
        logoutButton.addEventListener( 
            'click', 
            logoutUser 
        ); 
 
    } 
 
 
    const sessionSelect = 
        document.getElementById( 
            'sessionSelect' 
        ); 
 
    if (sessionSelect) { 
 
        sessionSelect.addEventListener( 
            'change', 
            function () { 
 
                currentSelected.sessionId = 
                    this.value; 
 
                refreshSelectedResults(); 
 
            } 
        ); 
 
    } 
 
 
    const termSelect = 
        document.getElementById( 
            'termSelect' 
        ); 
 
    if (termSelect) { 
 
        termSelect.addEventListener( 
            'change', 
            function () { 
 
                currentSelected.term = 
                    this.value; 
 
                refreshSelectedResults(); 
 
            } 
        ); 
 
    } 
 
 
    const classSelect = 
        document.getElementById( 
            'classSelect' 
        ); 
 
    if (classSelect) { 
 
        classSelect.addEventListener( 
            'change', 
            function () { 
 
                currentSelected.classId = 
                    this.value; 
 
                refreshSelectedResults(); 
 
            } 
        ); 
 
    } 
 
 
    const closeMessage = 
        document.getElementById( 
            'closeMessage' 
        ); 
 
    if (closeMessage) { 
 
        closeMessage.addEventListener( 
            'click', 
            hidePageMessage 
        ); 
 
    } 
 
 
    const closeStudentResultButton = 
        document.getElementById( 
            'closeStudentResultButton' 
        ); 
 
    if (closeStudentResultButton) { 
 
        closeStudentResultButton.addEventListener( 
            'click', 
            closeStudentResultModal 
        ); 
 
    } 
 
 
    const cancelResultButton = 
        document.getElementById( 
            'cancelResultButton' 
        ); 
 
    if (cancelResultButton) { 
 
        cancelResultButton.addEventListener( 
            'click', 
            closeStudentResultModal 
        ); 
 
    } 
 
 
    const studentResultModal = 
        document.getElementById( 
            'studentResultModal' 
        ); 
 
    if (studentResultModal) { 
 
        studentResultModal.addEventListener( 
            'click', 
            function (event) { 
 
                if ( 
                    event.target === 
                    studentResultModal 
                ) { 
 
                    closeStudentResultModal(); 
 
                } 
 
            } 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   LOAD SETUP 
============================================================ */ 
 
async function loadSetup() { 
 
    showSelectionLoading( 
        'Loading result management setup...' 
    ); 
 
    try { 
 
        const response = 
            await apiRequest( 
                'getResultManagementSetup', 
                { 
                    schoolId: 
                        currentSession.schoolId 
                } 
            ); 
 
        if ( 
            !response || 
            !response.success 
        ) { 
 
            throw new Error( 
                response && 
                response.error 
                    ? response.error 
                    : 'Unable to load result management setup.' 
            ); 
 
        } 
 
        currentSetup = 
            response; 
 
        populateSessionSelect( 
            response.sessions || 
            [] 
        ); 
 
        populateTermSelect( 
            response.terms || 
            [] 
        ); 
 
        populateClassSelect( 
            response.classes || 
            [] 
        ); 
 
        setDefaultSelections(); 
 
        hideSelectionMessage(); 
 
        await refreshSelectedResults(); 
 
    } catch (error) { 
 
        console.error( 
            'Setup error:', 
            error 
        ); 
 
        showSelectionMessage( 
            error.message || 
            'Unable to load result management setup.' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   POPULATE SESSION SELECT 
============================================================ */ 
 
function populateSessionSelect( 
    sessions 
) { 
 
    const select = 
        document.getElementById( 
            'sessionSelect' 
        ); 
 
    if (!select) { 
        return; 
    } 
 
    select.innerHTML = 
        '<option value="">Select session</option>'; 
 
    sessions.forEach( 
        function (session) { 
 
            const option = 
                document.createElement( 
                    'option' 
                ); 
 
            option.value = 
                session.sessionId || 
                ''; 
 
            option.textContent = 
                session.sessionName || 
                ''; 
 
            select.appendChild( 
                option 
            ); 
 
        } 
    ); 
 
} 
 
 
/* ============================================================ 
   POPULATE TERM SELECT 
============================================================ */ 
 
function populateTermSelect( 
    terms 
) { 
 
    const select = 
        document.getElementById( 
            'termSelect' 
        ); 
 
    if (!select) { 
        return; 
    } 
 
    select.innerHTML = 
        '<option value="">Select term</option>'; 
 
    terms.forEach( 
        function (term) { 
 
            const option = 
                document.createElement( 
                    'option' 
                ); 
 
            option.value = 
                term; 
 
            option.textContent = 
                term; 
 
            select.appendChild( 
                option 
            ); 
 
        } 
    ); 
 
} 
 
 
/* ============================================================ 
   POPULATE CLASS SELECT 
============================================================ */ 
 
function populateClassSelect( 
    classes 
) { 
 
    const select = 
        document.getElementById( 
            'classSelect' 
        ); 
 
    if (!select) { 
        return; 
    } 
 
    select.innerHTML = 
        '<option value="">Select class</option>'; 
 
    classes.forEach( 
        function (classItem) { 
 
            const option = 
                document.createElement( 
                    'option' 
                ); 
 
            option.value = 
                classItem.classId || 
                ''; 
 
            option.textContent = 
                buildClassName( 
                    classItem 
                ); 
 
            select.appendChild( 
                option 
            ); 
 
        } 
    ); 
 
} 
 
 
/* ============================================================ 
   DEFAULT SELECTIONS 
============================================================ */ 
 
function setDefaultSelections() { 
 
    const sessions = 
        currentSetup && 
        Array.isArray( 
            currentSetup.sessions 
        ) 
            ? currentSetup.sessions 
            : []; 
 
    const terms = 
        currentSetup && 
        Array.isArray( 
            currentSetup.terms 
        ) 
            ? currentSetup.terms 
            : []; 
 
    const classes = 
        currentSetup && 
        Array.isArray( 
            currentSetup.classes 
        ) 
            ? currentSetup.classes 
            : []; 
 
 
    let selectedSession = 
        sessions.find( 
            function (session) { 
 
                return String( 
                    session.status || 
                    '' 
                ).toLowerCase() === 
                'active'; 
 
            } 
        ); 
 
 
    if (!selectedSession) { 
 
        selectedSession = 
            sessions[0]; 
 
    } 
 
 
    if (selectedSession) { 
 
        currentSelected.sessionId = 
            selectedSession.sessionId || 
            ''; 
 
        const sessionSelect = 
            document.getElementById( 
                'sessionSelect' 
            ); 
 
        if (sessionSelect) { 
 
            sessionSelect.value = 
                currentSelected.sessionId; 
 
        } 
 
    } 
 
 
    let selectedTerm = 
        terms.find( 
            function (term) { 
 
                return String(term) 
                    .toLowerCase() === 
                    'first term'; 
 
            } 
        ); 
 
 
    if (!selectedTerm) { 
 
        selectedTerm = 
            terms[0]; 
 
    } 
 
 
    if (selectedTerm) { 
 
        currentSelected.term = 
            selectedTerm; 
 
        const termSelect = 
            document.getElementById( 
                'termSelect' 
            ); 
 
        if (termSelect) { 
 
            termSelect.value = 
                selectedTerm; 
 
        } 
 
    } 
 
 
    let selectedClass = 
        classes.find( 
            function (classItem) { 
 
                return String( 
                    classItem.status || 
                    '' 
                ).toLowerCase() === 
                'active'; 
 
            } 
        ); 
 
 
    if (!selectedClass) { 
 
        selectedClass = 
            classes[0]; 
 
    } 
 
 
    if (selectedClass) { 
 
        currentSelected.classId = 
            selectedClass.classId || 
            ''; 
 
        const classSelect = 
            document.getElementById( 
                'classSelect' 
            ); 
 
        if (classSelect) { 
 
            classSelect.value = 
                currentSelected.classId; 
 
        } 
 
    } 
 
} 
 
 
/* ============================================================ 
   REFRESH SELECTED RESULTS 
============================================================ */ 
 
async function refreshSelectedResults() { 
 
    hidePageMessage(); 
 
    const { 
        sessionId, 
        term, 
        classId 
    } = 
        currentSelected; 
 
 
    if ( 
        !sessionId || 
        !term || 
        !classId 
    ) { 
 
        hideResultSections(); 
 
        return; 
 
    } 
 
 
    showSelectionLoading( 
        'Loading class results...' 
    ); 
 
 
    try { 
 
        const overview = 
            await apiRequest( 
                'getResultManagementOverview', 
                { 
                    schoolId: 
                        currentSession.schoolId, 
 
                    sessionId: 
                        sessionId, 
 
                    term: 
                        term, 
 
                    classId: 
                        classId 
                } 
            ); 
 
 
        if ( 
            !overview || 
            !overview.success 
        ) { 
 
            throw new Error( 
                overview && 
                overview.error 
                    ? overview.error 
                    : 'Unable to load result overview.' 
            ); 
 
        } 
 
 
        currentOverview = 
            overview; 
 
 
        renderOverview( 
            overview 
        ); 
 
 
        const students = 
            await apiRequest( 
                'getResultManagementStudents', 
                { 
                    schoolId: 
                        currentSession.schoolId, 
 
                    sessionId: 
                        sessionId, 
 
                    term: 
                        term, 
 
                    classId: 
                        classId 
                } 
            ); 
 
 
        if ( 
            !students || 
            !students.success 
        ) { 
 
            throw new Error( 
                students && 
                students.error 
                    ? students.error 
                    : 'Unable to load students.' 
            ); 
 
        } 
 
 
        renderStudents( 
            students.students || 
            [] 
        ); 
 
 
        hideSelectionMessage(); 
 
    } catch (error) { 
 
        console.error( 
            'Result loading error:', 
            error 
        ); 
 
        hideResultSections(); 
 
        showSelectionMessage( 
            error.message || 
            'Unable to load class results.' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   HIDE RESULT SECTIONS 
============================================================ */ 
 
function hideResultSections() { 
 
    const overviewSection = 
        document.getElementById( 
            'overviewSection' 
        ); 
 
    const studentsSection = 
        document.getElementById( 
            'studentsSection' 
        ); 
 
    if (overviewSection) { 
 
        overviewSection.classList.add( 
            'hidden' 
        ); 
 
    } 
 
    if (studentsSection) { 
 
        studentsSection.classList.add( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   SHOW RESULT SECTIONS 
============================================================ */ 
 
function showResultSections() { 
 
    const overviewSection = 
        document.getElementById( 
            'overviewSection' 
        ); 
 
    const studentsSection = 
        document.getElementById( 
            'studentsSection' 
        ); 
 
    if (overviewSection) { 
 
        overviewSection.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
    if (studentsSection) { 
 
        studentsSection.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   SELECTION LOADING 
============================================================ */ 
 
function showSelectionLoading( 
    message 
) { 
 
    const messageBox = 
        document.getElementById( 
            'selectionMessage' 
        ); 
 
    const messageText = 
        document.getElementById( 
            'selectionMessageText' 
        ); 
 
 
    if (messageText) { 
 
        messageText.textContent = 
            message || 
            'Loading...'; 
 
    } 
 
 
    if (messageBox) { 
 
        messageBox.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   SELECTION MESSAGE 
============================================================ */ 
 
function showSelectionMessage( 
    message 
) { 
 
    const messageBox = 
        document.getElementById( 
            'selectionMessage' 
        ); 
 
    const messageText = 
        document.getElementById( 
            'selectionMessageText' 
        ); 
 
 
    if (messageText) { 
 
        messageText.textContent = 
            message || 
            'Something went wrong.'; 
 
    } 
 
 
    if (messageBox) { 
 
        messageBox.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   HIDE SELECTION MESSAGE 
============================================================ */ 
 
function hideSelectionMessage() { 
 
    const messageBox = 
        document.getElementById( 
            'selectionMessage' 
        ); 
 
    if (messageBox) { 
 
        messageBox.classList.add( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   RENDER OVERVIEW 
============================================================ */ 
 
function renderOverview( 
    data 
) { 
 
    showResultSections(); 
 
    const students = 
        data.students || 
        {}; 
 
    setText( 
        'overviewTitle', 
        buildClassName( 
            data.class || {} 
        ) 
    ); 
 
 
    const sessionName = 
        data.session && 
        data.session.sessionName 
            ? data.session.sessionName 
            : ''; 
 
 
    const term = 
        data.term || 
        ''; 
 
 
    setText( 
        'overviewSubtitle', 
        sessionName + 
        ( 
            sessionName && 
            term 
                ? ' • ' 
                : '' 
        ) + 
        term 
    ); 
 
 
    setText( 
        'totalStudents', 
        safeNumber( 
            students.total 
        ) 
    ); 
 
 
    setText( 
        'completedStudents', 
        safeNumber( 
            students.complete 
        ) 
    ); 
 
 
    setText( 
        'incompleteStudents', 
        safeNumber( 
            students.incomplete 
        ) 
    ); 
 
 
    setText( 
        'notStartedStudents', 
        safeNumber( 
            students.notStarted 
        ) 
    ); 
 
 
    renderReadiness( 
        data 
    ); 
 
} 
 
 
/* ============================================================ 
   RENDER READINESS 
============================================================ */ 
 
function renderReadiness( 
    data 
) { 
 
    const badge = 
        document.getElementById( 
            'readinessBadge' 
        ); 
 
    const validationPanel = 
        document.getElementById( 
            'validationPanel' 
        ); 
 
    const validationTitle = 
        document.getElementById( 
            'validationTitle' 
        ); 
 
    const validationMessage = 
        document.getElementById( 
            'validationMessage' 
        ); 
 
 
    const validation = 
        data.validation || 
        {}; 
 
 
    const ready = 
        data.readyForPdf === true || 
        validation.ready === true; 
 
 
    if (badge) { 
 
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
 
 
    if (validationTitle) { 
 
        validationTitle.textContent = 
            ready 
                ? 'Results are ready' 
                : 'Results need attention'; 
 
    } 
 
 
    if (validationMessage) { 
 
        validationMessage.textContent = 
            buildValidationMessage( 
                validation, 
                ready 
            ); 
 
    } 
 
 
    if (validationPanel) { 
 
        validationPanel.classList.remove( 
            'ready', 
            'not-ready', 
            'success', 
            'danger' 
        ); 
 
        validationPanel.classList.add( 
            ready 
                ? 'ready' 
                : 'not-ready' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   BUILD VALIDATION MESSAGE 
============================================================ */ 
 
function buildValidationMessage( 
    validation, 
    ready 
) { 
 
    if (ready) { 
 
        return ( 
            'All required scores are available. ' + 
            'The class results can be prepared for PDF generation.' 
        ); 
 
    } 
 
 
    const missing = 
        getValidationCount( 
            validation, 
            [ 
                'missing', 
                'missingScores', 
                'missingCount' 
            ] 
        ); 
 
 
    const invalid = 
        getValidationCount( 
            validation, 
            [ 
                'invalid', 
                'invalidScores', 
                'invalidCount' 
            ] 
        ); 
 
 
    const parts = []; 
 
 
    if (missing > 0) { 
 
        parts.push( 
            missing + 
            ' missing score' + 
            ( 
                missing === 1 
                    ? '' 
                    : 's' 
            ) 
        ); 
 
    } 
 
 
    if (invalid > 0) { 
 
        parts.push( 
            invalid + 
            ' invalid score' + 
            ( 
                invalid === 1 
                    ? '' 
                    : 's' 
            ) 
        ); 
 
    } 
 
 
    if (!parts.length) { 
 
        return ( 
            validation.message || 
            'Some results require attention before PDF generation.' 
        ); 
 
    } 
 
 
    return ( 
        parts.join(' and ') + 
        ' require attention before the class results are ready.' 
    ); 
 
} 
 
 
/* ============================================================ 
   GET VALIDATION COUNT 
============================================================ */ 
 
function getValidationCount( 
    validation, 
    keys 
) { 
 
    for ( 
        let i = 0; 
        i < keys.length; 
        i++ 
    ) { 
 
        const value = 
            validation[ 
                keys[i] 
            ]; 
 
 
        if ( 
            value !== undefined && 
            value !== null && 
            value !== '' 
        ) { 
 
            const number = 
                Number(value); 
 
            if ( 
                Number.isFinite( 
                    number 
                ) 
            ) { 
 
                return number; 
 
            } 
 
        } 
 
    } 
 
 
    return 0; 
 
} 
 
 
/* ============================================================ 
   RENDER STUDENTS 
============================================================ */ 
 
function renderStudents( 
    students 
) { 
 
    const body = 
        document.getElementById( 
            'resultsTableBody' 
        ); 
 
    const table = 
        document.getElementById( 
            'resultsTable' 
        ); 
 
    const loading = 
        document.getElementById( 
            'tableLoading' 
        ); 
 
    const empty = 
        document.getElementById( 
            'tableEmpty' 
        ); 
 
    const recordCount = 
        document.getElementById( 
            'recordCount' 
        ); 
 
 
    if (loading) { 
 
        loading.classList.add( 
            'hidden' 
        ); 
 
    } 
 
 
    if (recordCount) { 
 
        recordCount.textContent = 
            students.length + 
            ( 
                students.length === 1 
                    ? ' student' 
                    : ' students' 
            ); 
 
    } 
 
 
    if (!body) { 
        return; 
    } 
 
 
    body.innerHTML = ''; 
 
 
    if (!students.length) { 
 
        if (table) { 
 
            table.classList.add( 
                'hidden' 
            ); 
 
        } 
 
        if (empty) { 
 
            empty.classList.remove( 
                'hidden' 
            ); 
 
        } 
 
        return; 
 
    } 
 
 
    if (table) { 
 
        table.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
 
    if (empty) { 
 
        empty.classList.add( 
            'hidden' 
        ); 
 
    } 
 
 
    students.forEach( 
        function (student) { 
 
            body.appendChild( 
                createStudentRow( 
                    student 
                ) 
            ); 
 
        } 
    ); 
 
} 
 
 
/* ============================================================ 
   CREATE STUDENT ROW 
============================================================ */ 
 
function createStudentRow( 
    student 
) { 
 
    const row = 
        document.createElement( 
            'tr' 
        ); 
 
 
    const status = 
        normalizeStatus( 
            student.completionStatus 
        ); 
 
 
    const position = 
        firstValue( 
            student.position, 
            '' 
        ); 
 
 
    const total = 
        firstValue( 
            student.total, 
            '' 
        ); 
 
 
    const average = 
        firstValue( 
            student.average, 
            '' 
        ); 
 
 
    const statusClass = 
        getStatusClass( 
            status 
        ); 
 
 
    row.innerHTML = ` 
 
        <td> 
            ${escapeHtml( 
                student.admissionNo || 
                '' 
            )} 
        </td> 
 
        <td> 
            <strong> 
                ${escapeHtml( 
                    student.fullName || 
                    '' 
                )} 
            </strong> 
        </td> 
 
        <td> 
            ${escapeHtml( 
                formatNumberValue( 
                    total 
                ) 
            )} 
        </td> 
 
        <td> 
            ${escapeHtml( 
                formatNumberValue( 
                    average 
                ) 
            )} 
        </td> 
 
        <td> 
            ${escapeHtml( 
                formatPositionValue( 
                    position 
                ) 
            )} 
        </td> 
 
        <td> 
            <span class="status-badge ${statusClass}"> 
                ${escapeHtml( 
                    student.completionStatus || 
                    'Not Started' 
                )} 
            </span> 
        </td> 
 
        <td> 
            <button 
                type="button" 
                class="view-button" 
                data-student-id="${escapeHtmlAttribute( 
                    student.studentId || 
                    '' 
                )}" 
            > 
                View Result 
            </button> 
        </td> 
 
    `; 
 
 
    const viewButton = 
        row.querySelector( 
            '.view-button' 
        ); 
 
 
    if (viewButton) { 
 
        viewButton.addEventListener( 
            'click', 
            function () { 
 
                openStudentResult( 
                    student.studentId 
                ); 
 
            } 
        ); 
 
    } 
 
 
    return row; 
 
} 
 
 
/* ============================================================ 
   OPEN STUDENT RESULT 
============================================================ */ 
 
async function openStudentResult( 
    studentId 
) { 
 
    if (!studentId) { 
 
        showPageMessage( 
            'Student information is missing.' 
        ); 
 
        return; 
 
    } 
 
 
    currentViewedStudentId = 
        studentId; 
 
    currentViewedResult = 
        null; 
 
 
    const modal = 
        document.getElementById( 
            'studentResultModal' 
        ); 
 
    const modalBody = 
        document.getElementById( 
            'resultModalBody' 
        ); 
 
    const modalTitle = 
        document.getElementById( 
            'studentResultTitle' 
        ); 
 
 
    if (modalTitle) { 
 
        modalTitle.textContent = 
            'Student Result'; 
 
    } 
 
 
    if (modalBody) { 
 
        modalBody.innerHTML = ` 
 
            <div class="result-loading"> 
 
                <div class="loading-spinner"></div> 
 
                <p> 
                    Loading student result... 
                </p> 
 
            </div> 
 
        `; 
 
    } 
 
 
    if (modal) { 
 
        modal.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
 
    try { 
 
        /* 
         * Load the final result. 
         * 
         * The final result already contains 
         * comments when they exist. 
         */ 
 
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
 
                    studentId: 
                        studentId 
                } 
            ); 
 
 
        if ( 
            !response || 
            !response.success || 
            !response.result 
        ) { 
 
            throw new Error( 
                response && 
                response.error 
                    ? response.error 
                    : 'Unable to load the student result.' 
            ); 
 
        } 
 
 
        currentViewedResult = 
            response.result; 
 
 
        /* 
         * If FinalResults.gs did not return 
         * comments for some reason, separately 
         * retrieve them from Comments.gs. 
         */ 
 
        if ( 
            !currentViewedResult.comments 
        ) { 
 
            try { 
 
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
 
                            studentId: 
                                studentId 
                        } 
                    ); 
 
 
                if ( 
                    commentResponse && 
                    commentResponse.success && 
                    commentResponse.exists 
                ) { 
 
                    currentViewedResult.comments = 
                        commentResponse.comment; 
 
                } 
 
            } catch (commentError) { 
 
                console.warn( 
                    'Unable to load comments separately:', 
                    commentError 
                ); 
 
            } 
 
        } 
 
 
        renderStudentResult( 
            currentViewedResult 
        ); 
 
    } catch (error) { 
 
        console.error( 
            'Student result error:', 
            error 
        ); 
 
 
        if (modalBody) { 
 
            modalBody.innerHTML = ` 
 
                <div class="result-error"> 
 
                    ${escapeHtml( 
                        error.message || 
                        'Unable to load the student result.' 
                    )} 
 
                </div> 
 
            `; 
 
        } 
 
    } 
 
} 
 
 
/* ============================================================ 
   RENDER STUDENT RESULT 
============================================================ */ 
 
function renderStudentResult( 
    result 
) { 
 
    const modalBody = 
        document.getElementById( 
            'resultModalBody' 
        ); 
 
    const modalTitle = 
        document.getElementById( 
            'studentResultTitle' 
        ); 
 
 
    if (!modalBody) { 
        return; 
    } 
 
 
    const student = 
        result.student || 
        {}; 
 
    const school = 
        result.school || 
        {}; 
 
    const session = 
        result.session || 
        {}; 
 
    const classInfo = 
        result.class || 
        {}; 
 
    const subjects = 
        Array.isArray( 
            result.subjects 
        ) 
            ? result.subjects 
            : []; 
 
    const summary = 
        result.summary || 
        {}; 
 
    const comments = 
        result.comments || 
        null; 
 
 
    /* 
     * FinalResults.gs returns: 
     * 
     * position: { 
     *     position: number, 
     *     status: string 
     * } 
     */ 
 
    const position = 
        firstValue( 
            result.position && 
            result.position.position, 
 
            summary.position, 
 
            result.position && 
            result.position.value, 
 
            null 
        ); 
 
 
    if (modalTitle) { 
 
        modalTitle.textContent = 
            student.fullName 
                ? student.fullName + 
                  ' — Result' 
                : 'Student Result'; 
 
    } 
 
 
    let html = ''; 
 
 
    /* ======================================================== 
       STUDENT / SCHOOL INFORMATION 
    ======================================================== */ 
 
    html += ` 
 
        <div class="result-student-header"> 
 
            <div class="result-student-name"> 
                ${escapeHtml( 
                    student.fullName || 
                    '' 
                )} 
            </div> 
 
            <div class="result-student-meta"> 
 
                <span> 
                    Admission No: 
                    <strong> 
                        ${escapeHtml( 
                            student.admissionNo || 
                            '' 
                        )} 
                    </strong> 
                </span> 
 
                <span> 
                    Class: 
                    <strong> 
                        ${escapeHtml( 
                            buildClassName( 
                                classInfo 
                            ) 
                        )} 
                    </strong> 
                </span> 
 
                <span> 
                    Gender: 
                    <strong> 
                        ${escapeHtml( 
                            student.gender || 
                            '' 
                        )} 
                    </strong> 
                </span> 
 
            </div> 
 
        </div> 
 
 
        <div class="result-school-meta"> 
 
            <div> 
                <strong> 
                    ${escapeHtml( 
                        school.schoolName || 
                        '' 
                    )} 
                </strong> 
            </div> 
 
            <div> 
 
                ${escapeHtml( 
                    session.sessionName || 
                    '' 
                )} 
 
                ${ 
                    session.sessionName && 
                    result.term 
                        ? ' • ' 
                        : '' 
                } 
 
                ${escapeHtml( 
                    result.term || 
                    '' 
                )} 
 
            </div> 
 
        </div> 
 
    `; 
 
 
    /* ======================================================== 
       SUBJECT TABLE 
    ======================================================== */ 
 
    html += ` 
 
        <div class="result-table-wrapper"> 
 
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
 
    `; 
 
 
    if (!subjects.length) { 
 
        html += ` 
 
                    <tr> 
 
                        <td 
                            colspan="6" 
                            class="result-empty-cell" 
                        > 
                            No subject results available. 
                        </td> 
 
                    </tr> 
 
        `; 
 
    } else { 
 
        subjects.forEach( 
            function (subject) { 
 
                const test = 
                    firstValue( 
                        subject.testScore, 
                        '' 
                    ); 
 
                const exam = 
                    firstValue( 
                        subject.examScore, 
                        '' 
                    ); 
 
                const total = 
                    firstValue( 
                        subject.totalScore, 
                        '' 
                    ); 
 
                const grade = 
                    firstValue( 
                        subject.grade, 
                        '' 
                    ); 
 
                const remark = 
                    firstValue( 
                        subject.remark, 
                        '' 
                    ); 
 
                const subjectName = 
                    firstValue( 
                        subject.subjectName, 
                        subject.subject, 
                        '' 
                    ); 
 
 
                html += ` 
 
                    <tr> 
 
                        <td class="subject-name"> 
                            ${escapeHtml( 
                                subjectName 
                            )} 
                        </td> 
 
                        <td> 
                            ${escapeHtml( 
                                formatNumberValue( 
                                    test 
                                ) 
                            )} 
                        </td> 
 
                        <td> 
                            ${escapeHtml( 
                                formatNumberValue( 
                                    exam 
                                ) 
                            )} 
                        </td> 
 
                        <td> 
                            <strong> 
                                ${escapeHtml( 
                                    formatNumberValue( 
                                        total 
                                    ) 
                                )} 
                            </strong> 
                        </td> 
 
                        <td> 
                            <strong> 
                                ${escapeHtml( 
                                    grade 
                                )} 
                            </strong> 
                        </td> 
 
                        <td> 
                            ${escapeHtml( 
                                remark 
                            )} 
                        </td> 
 
                    </tr> 
 
                `; 
 
            } 
        ); 
 
    } 
 
 
    html += ` 
 
                </tbody> 
 
            </table> 
 
        </div> 
 
    `; 
 
 
    /* ======================================================== 
       SUMMARY 
    ======================================================== */ 
 
    html += ` 
 
        <div class="result-summary-grid"> 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
                    Subjects Offered 
                </span> 
 
                <strong> 
                    ${escapeHtml( 
                        formatNumberValue( 
                            summary.subjectCount 
                        ) 
                    )} 
                </strong> 
 
            </div> 
 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
                    Subjects Scored 
                </span> 
 
                <strong> 
                    ${escapeHtml( 
                        formatNumberValue( 
                            summary.scoredSubjects 
                        ) 
                    )} 
                </strong> 
 
            </div> 
 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
                    Overall Total 
                </span> 
 
                <strong> 
                    ${escapeHtml( 
                        formatNumberValue( 
                            summary.overallTotal 
                        ) 
                    )} 
                </strong> 
 
            </div> 
 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
                    Average 
                </span> 
 
                <strong> 
                    ${escapeHtml( 
                        formatNumberValue( 
                            summary.average 
                        ) 
                    )} 
                </strong> 
 
            </div> 
 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
                    Position 
                </span> 
 
                <strong> 
                    ${escapeHtml( 
                        formatPositionValue( 
                            position 
                        ) 
                    )} 
                </strong> 
 
            </div> 
 
 
            <div class="result-summary-item"> 
 
                <span class="result-summary-label"> 
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
 
    `; 
 
 
    /* ======================================================== 
       COMMENTS EDITOR 
    ======================================================== */ 
 
    const teacherComment = 
        comments 
            ? firstValue( 
                comments.teacherComment, 
                comments['Teacher Comment'], 
                '' 
            ) 
            : ''; 
 
 
    const principalComment = 
        comments 
            ? firstValue( 
                comments.principalComment, 
                comments['Principal Comment'], 
                '' 
            ) 
            : ''; 
 
 
    html += ` 
 
        <section class="result-comments-editor"> 
 
            <div class="result-comments-editor-header"> 
 
                <div> 
 
                    <div class="result-comment-title"> 
                        Result Comments 
                    </div> 
 
                    <p class="result-comments-help"> 
                        Add or update the comments that will 
                        appear on the student's final result. 
                    </p> 
 
                </div> 
 
            </div> 
 
 
            <div class="result-comment-field"> 
 
                <label 
                    for="teacherCommentInput" 
                > 
                    Teacher's Comment 
                </label> 
 
                <textarea 
                    id="teacherCommentInput" 
                    class="result-comment-input" 
                    maxlength="500" 
                    rows="4" 
                    placeholder="Enter teacher's comment..." 
                >${escapeHtml( 
                    teacherComment 
                )}</textarea> 
 
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
 
                <label 
                    for="principalCommentInput" 
                > 
                    Principal's Comment 
                </label> 
 
                <textarea 
                    id="principalCommentInput" 
                    class="result-comment-input" 
                    maxlength="500" 
                    rows="4" 
                    placeholder="Enter principal's comment..." 
                >${escapeHtml( 
                    principalComment 
                )}</textarea> 
 
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
 
 
    /* ======================================================== 
       EXISTING COMMENT DISPLAY 
    ======================================================== */ 
 
    html += ` 
 
        <div class="result-comments"> 
 
            <div class="result-comment"> 
 
                <div class="result-comment-title"> 
                    Teacher's Comment 
                </div> 
 
                <div 
                    class="result-comment-text" 
                    id="displayTeacherComment" 
                > 
                    ${escapeHtml( 
                        teacherComment || 
                        'No teacher comment provided.' 
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
                        principalComment || 
                        'No principal comment provided.' 
                    )} 
                </div> 
 
            </div> 
 
        </div> 
 
    `; 
 
 
    /* ======================================================== 
       PDF ACTION 
    ======================================================== */ 
 
    html += ` 
 
        <div class="result-pdf-action"> 
 
            <button 
                type="button" 
                class="primary-button result-pdf-button" 
                id="generateStudentPdfButton" 
            > 
                Generate PDF 
            </button> 
 
            <span class="result-pdf-note"> 
                Generate the final student result as a PDF. 
            </span> 
 
        </div> 
 
    `; 
 
 
    modalBody.innerHTML = 
        html; 
 
 
    bindCommentEditor(); 
 
    bindPdfButton(); 
 
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
            function () { 
 
                updateCommentCounter( 
                    teacherInput, 
                    'teacherCommentCounter' 
                ); 
 
            } 
        ); 
 
    } 
 
 
    if (principalInput) { 
 
        principalInput.addEventListener( 
            'input', 
            function () { 
 
                updateCommentCounter( 
                    principalInput, 
                    'principalCommentCounter' 
                ); 
 
            } 
        ); 
 
    } 
 
 
    if (saveButton) { 
 
        saveButton.addEventListener( 
            'click', 
            saveCurrentResultComments 
        ); 
 
    } 
 
 
    updateCommentCounter( 
        teacherInput, 
        'teacherCommentCounter' 
    ); 
 
    updateCommentCounter( 
        principalInput, 
        'principalCommentCounter' 
    ); 
 
} 
 
 
/* ============================================================ 
   UPDATE COMMENT COUNTER 
============================================================ */ 
 
function updateCommentCounter( 
    input, 
    counterId 
) { 
 
    const counter = 
        document.getElementById( 
            counterId 
        ); 
 
 
    if (!counter) { 
        return; 
    } 
 
 
    const length = 
        input 
            ? String( 
                input.value || 
                '' 
            ).length 
            : 0; 
 
 
    counter.textContent = 
        length + 
        '/500'; 
 
} 
 
 
/* ============================================================ 
   SAVE CURRENT RESULT COMMENTS 
============================================================ */ 
 
async function saveCurrentResultComments() { 
 
    if (!currentViewedStudentId) { 
 
        showPageMessage( 
            'Student information is missing.' 
        ); 
 
        return; 
 
    } 
 
 
    if ( 
        !currentSelected.sessionId || 
        !currentSelected.term 
    ) { 
 
        showPageMessage( 
            'Session and term information are required.' 
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
 
    const status = 
        document.getElementById( 
            'resultCommentSaveStatus' 
        ); 
 
 
    const teacherComment = 
        teacherInput 
            ? String( 
                teacherInput.value || 
                '' 
            ).trim() 
            : ''; 
 
 
    const principalComment = 
        principalInput 
            ? String( 
                principalInput.value || 
                '' 
            ).trim() 
            : ''; 
 
 
    if ( 
        !teacherComment && 
        !principalComment 
    ) { 
 
        showCommentSaveStatus( 
            'Enter a teacher comment or principal comment.', 
            true 
        ); 
 
        return; 
 
    } 
 
 
    if ( 
        teacherComment.length > 
        500 
    ) { 
 
        showCommentSaveStatus( 
            'Teacher comment cannot exceed 500 characters.', 
            true 
        ); 
 
        return; 
 
    } 
 
 
    if ( 
        principalComment.length > 
        500 
    ) { 
 
        showCommentSaveStatus( 
            'Principal comment cannot exceed 500 characters.', 
            true 
        ); 
 
        return; 
 
    } 
 
 
    if (saveButton) { 
 
        saveButton.disabled = 
            true; 
 
        saveButton.textContent = 
            'Saving...'; 
 
    } 
 
 
    if (status) { 
 
        status.textContent = 
            'Saving comments...'; 
 
        status.classList.remove( 
            'error', 
            'success' 
        ); 
 
    } 
 
 
    try { 
 
        const response = 
            await apiRequest( 
                'saveResultComments', 
                { 
                    schoolId: 
                        currentSession.schoolId, 
 
                    sessionId: 
                        currentSelected.sessionId, 
 
                    term: 
                        currentSelected.term, 
 
                    studentId: 
                        currentViewedStudentId, 
 
                    teacherComment: 
                        teacherComment, 
 
                    principalComment: 
                        principalComment, 
 
                    updatedBy: 
                        currentSession.fullName || 
                        currentSession.userId || 
                        'System User' 
                } 
            ); 
 
 
        if ( 
            !response || 
            !response.success 
        ) { 
 
            throw new Error( 
                response && 
                response.error 
                    ? response.error 
                    : 'Unable to save result comments.' 
            ); 
 
        } 
 
 
        /* 
         * Keep the frontend result state 
         * synchronized with the saved comments. 
         */ 
 
        if (!currentViewedResult) { 
 
            currentViewedResult = {}; 
 
        } 
 
 
        currentViewedResult.comments = { 
 
            'Comment ID': 
                response.comment && 
                response.comment['Comment ID'] 
                    ? response.comment['Comment ID'] 
                    : '', 
 
            'School ID': 
                currentSession.schoolId, 
 
            'Session ID': 
                currentSelected.sessionId, 
 
            'Term': 
                currentSelected.term, 
 
            'Student ID': 
                currentViewedStudentId, 
 
            'Teacher Comment': 
                teacherComment, 
 
            'Principal Comment': 
                principalComment, 
 
            'Updated By': 
                currentSession.fullName || 
                currentSession.userId || 
                'System User', 
 
            'Updated At': 
                response.comment && 
                response.comment['Updated At'] 
                    ? response.comment['Updated At'] 
                    : '' 
 
        }; 
 
 
        updateDisplayedComments( 
            teacherComment, 
            principalComment 
        ); 
 
 
        showCommentSaveStatus( 
            response.message || 
            'Result comments saved successfully.', 
            false 
        ); 
 
 
        showPageMessage( 
            response.message || 
            'Result comments saved successfully.' 
        ); 
 
 
    } catch (error) { 
 
        console.error( 
            'Save comments error:', 
            error 
        ); 
 
 
        showCommentSaveStatus( 
            error.message || 
            'Unable to save result comments.', 
            true 
        ); 
 
    } finally { 
 
        if (saveButton) { 
 
            saveButton.disabled = 
                false; 
 
            saveButton.textContent = 
                'Save Comments'; 
 
        } 
 
    } 
 
} 
 
 
/* ============================================================ 
   UPDATE DISPLAYED COMMENTS 
============================================================ */ 
 
function updateDisplayedComments( 
    teacherComment, 
    principalComment 
) { 
 
    const teacherDisplay = 
        document.getElementById( 
            'displayTeacherComment' 
        ); 
 
    const principalDisplay = 
        document.getElementById( 
            'displayPrincipalComment' 
        ); 
 
 
    if (teacherDisplay) { 
 
        teacherDisplay.textContent = 
            teacherComment || 
            'No teacher comment provided.'; 
 
    } 
 
 
    if (principalDisplay) { 
 
        principalDisplay.textContent = 
            principalComment || 
            'No principal comment provided.'; 
 
    } 
 
} 
 
 
/* ============================================================ 
   COMMENT SAVE STATUS 
============================================================ */ 
 
function showCommentSaveStatus( 
    message, 
    isError 
) { 
 
    const status = 
        document.getElementById( 
            'resultCommentSaveStatus' 
        ); 
 
 
    if (!status) { 
        return; 
    } 
 
 
    status.textContent = 
        message || 
        ''; 
 
 
    status.classList.remove( 
        'error', 
        'success' 
    ); 
 
 
    status.classList.add( 
        isError 
            ? 'error' 
            : 'success' 
    ); 
 
} 
 
 
/* ============================================================ 
   BIND PDF BUTTON 
============================================================ */ 
 
function bindPdfButton() { 
 
    const button = 
        document.getElementById( 
            'generateStudentPdfButton' 
        ); 
 
 
    if (!button) { 
        return; 
    } 
 
 
    button.addEventListener( 
        'click', 
        function () { 
 
            generateStudentPdf( 
                currentViewedStudentId 
            ); 
 
        } 
    ); 
 
} 
 
 
/* ============================================================ 
   GENERATE STUDENT PDF 
============================================================ */ 
 
async function generateStudentPdf( 
    studentId 
) { 
 
    if (!studentId) { 
 
        showPageMessage( 
            'Student information is missing.' 
        ); 
 
        return; 
 
    } 
 
 
    if ( 
        !currentSelected.sessionId || 
        !currentSelected.term 
    ) { 
 
        showPageMessage( 
            'Session and term information are required.' 
        ); 
 
        return; 
 
    } 
 
 
    const button = 
        document.getElementById( 
            'generateStudentPdfButton' 
        ); 
 
 
    if (button) { 
 
        button.disabled = 
            true; 
 
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
                        studentId 
                } 
            ); 
 
 
        if ( 
            !response || 
            !response.success 
        ) { 
 
            throw new Error( 
                response && 
                response.error 
                    ? response.error 
                    : 'The student result PDF could not be generated.' 
            ); 
 
        } 
 
 
        const pdfUrl = 
            response.file && 
            ( 
                response.file.url || 
                response.file.downloadUrl 
            ); 
 
 
        if (!pdfUrl) { 
 
            throw new Error( 
                'The PDF was generated, but no PDF link was returned.' 
            ); 
 
        } 
 
 
        showPageMessage( 
            response.message || 
            'Student result PDF generated successfully.' 
        ); 
 
 
        window.open( 
            pdfUrl, 
            '_blank' 
        ); 
 
 
    } catch (error) { 
 
        console.error( 
            'Generate PDF error:', 
            error 
        ); 
 
 
        showPageMessage( 
            error.message || 
            'Unable to generate the student result PDF.' 
        ); 
 
    } finally { 
 
        if (button) { 
 
            button.disabled = 
                false; 
 
            button.textContent = 
                'Generate PDF'; 
 
        } 
 
    } 
 
} 
 
 
/* ============================================================ 
   CLOSE STUDENT RESULT MODAL 
============================================================ */ 
 
function closeStudentResultModal() { 
 
    const modal = 
        document.getElementById( 
            'studentResultModal' 
        ); 
 
 
    if (modal) { 
 
        modal.classList.add( 
            'hidden' 
        ); 
 
    } 
 
 
    currentViewedStudentId = 
        ''; 
 
    currentViewedResult = 
        null; 
 
} 
 
 
/* ============================================================ 
   PAGE MESSAGE 
============================================================ */ 
 
function showPageMessage( 
    message 
) { 
 
    const pageMessage = 
        document.getElementById( 
            'pageMessage' 
        ); 
 
    const messageText = 
        document.getElementById( 
            'messageText' 
        ); 
 
 
    if (messageText) { 
 
        messageText.textContent = 
            message || 
            'Something went wrong.'; 
 
    } 
 
 
    if (pageMessage) { 
 
        pageMessage.classList.remove( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   HIDE PAGE MESSAGE 
============================================================ */ 
 
function hidePageMessage() { 
 
    const pageMessage = 
        document.getElementById( 
            'pageMessage' 
        ); 
 
 
    if (pageMessage) { 
 
        pageMessage.classList.add( 
            'hidden' 
        ); 
 
    } 
 
} 
 
 
/* ============================================================ 
   API REQUEST 
============================================================ */ 
 
async function apiRequest( 
    action, 
    data 
) { 
 
    const payload = 
        Object.assign( 
            { 
                action: 
                    action 
            }, 
            data || 
            {} 
        ); 
 
 
    const response = 
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
 
 
    if (!response.ok) { 
 
        throw new Error( 
            'Server request failed. Please try again.' 
        ); 
 
    } 
 
 
    const text = 
        await response.text(); 
 
 
    let result; 
 
 
    try { 
 
        result = 
            JSON.parse( 
                text 
            ); 
 
    } catch (error) { 
 
        console.error( 
            'Invalid JSON response:', 
            text 
        ); 
 
        throw new Error( 
            'The server returned an invalid response.' 
        ); 
 
    } 
 
 
    return result; 
 
} 
 
 
/* ============================================================ 
   LOGOUT 
============================================================ */ 
 
function logoutUser() { 
 
    localStorage.removeItem( 
        SESSION_KEY 
    ); 
 
    currentSession = 
        null; 
 
    currentSetup = 
        null; 
 
    currentSelected = { 
        sessionId: '', 
        term: '', 
        classId: '' 
    }; 
 
    currentViewedStudentId = 
        ''; 
 
    currentViewedResult = 
        null; 
 
    window.location.href = 
        'index.html'; 
 
} 
 
 
/* ============================================================ 
   HELPERS — TEXT 
============================================================ */ 
 
function setText( 
    elementId, 
    value 
) { 
 
    const element = 
        document.getElementById( 
            elementId 
        ); 
 
 
    if (!element) { 
        return; 
    } 
 
 
    element.textContent = 
        value !== null && 
        value !== undefined 
            ? String(value) 
            : ''; 
 
} 
 
 
/* ============================================================ 
   HELPERS — INITIALS 
============================================================ */ 
 
function getInitials( 
    name 
) { 
 
    const value = 
        String( 
            name || 
            '' 
        ).trim(); 
 
 
    if (!value) { 
        return 'U'; 
    } 
 
 
    const parts = 
        value 
            .split(/\s+/) 
            .filter(Boolean); 
 
 
    if (parts.length === 1) { 
 
        return parts[0] 
            .substring( 
                0, 
                2 
            ) 
            .toUpperCase(); 
 
    } 
 
 
    return ( 
        parts[0].charAt(0) + 
        parts[ 
            parts.length - 1 
        ].charAt(0) 
    ).toUpperCase(); 
 
} 
 
 
/* ============================================================ 
   HELPERS — CLASS NAME 
============================================================ */ 
 
function buildClassName( 
    classInfo 
) { 
 
    if (!classInfo) { 
        return ''; 
    } 
 
 
    const className = 
        classInfo.className || 
        ''; 
 
 
    const section = 
        classInfo.section || 
        ''; 
 
 
    if ( 
        className && 
        section 
    ) { 
 
        return ( 
            className + 
            ' - ' + 
            section 
        ); 
 
    } 
 
 
    return ( 
        className || 
        section || 
        '' 
    ); 
 
} 
 
 
/* ============================================================ 
   HELPERS — FIRST VALUE 
============================================================ */ 
 
function firstValue() { 
 
    for ( 
        let i = 0; 
        i < arguments.length; 
        i++ 
    ) { 
 
        const value = 
            arguments[i]; 
 
 
        if ( 
            value !== undefined && 
            value !== null && 
            value !== '' 
        ) { 
 
            return value; 
 
        } 
 
    } 
 
 
    return ''; 
 
} 
 
 
/* ============================================================ 
   HELPERS — SAFE NUMBER 
============================================================ */ 
 
function safeNumber( 
    value 
) { 
 
    if ( 
        value === undefined || 
        value === null || 
        value === '' 
    ) { 
 
        return '0'; 
 
    } 
 
 
    const number = 
        Number(value); 
 
 
    if ( 
        !Number.isFinite( 
            number 
        ) 
    ) { 
 
        return '0'; 
 
    } 
 
 
    return String( 
        number 
    ); 
 
} 
 
 
/* ============================================================ 
   HELPERS — FORMAT NUMBER 
============================================================ */ 
 
function formatNumberValue( 
    value 
) { 
 
    if ( 
        value === undefined || 
        value === null || 
        value === '' 
    ) { 
 
        return ''; 
 
    } 
 
 
    const number = 
        Number(value); 
 
 
    if ( 
        !Number.isFinite( 
            number 
        ) 
    ) { 
 
        return String( 
            value 
        ); 
 
    } 
 
 
    if ( 
        Number.isInteger( 
            number 
        ) 
    ) { 
 
        return String( 
            number 
        ); 
 
    } 
 
 
    return number.toFixed( 
        2 
    ); 
 
} 
 
 
/* ============================================================ 
   HELPERS — FORMAT POSITION 
============================================================ */ 
 
function formatPositionValue( 
    value 
) { 
 
    if ( 
        value === undefined || 
        value === null || 
        value === '' 
    ) { 
 
        return 'Not Available'; 
 
    } 
 
 
    if ( 
        typeof value === 'object' 
    ) { 
 
        value = 
            value.position !== undefined 
                ? value.position 
                : null; 
 
    } 
 
 
    if ( 
        value === null || 
        value === undefined || 
        value === '' 
    ) { 
 
        return 'Not Available'; 
 
    } 
 
 
    const number = 
        Number(value); 
 
 
    if ( 
        !Number.isFinite( 
            number 
        ) 
    ) { 
 
        return String( 
            value 
        ); 
 
    } 
 
 
    const lastTwo = 
        number % 100; 
 
 
    if ( 
        lastTwo >= 11 && 
        lastTwo <= 13 
    ) { 
 
        return ( 
            number + 
            'th' 
        ); 
 
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
   HELPERS — STATUS 
============================================================ */ 
 
function normalizeStatus( 
    status 
) { 
 
    return String( 
        status || 
        '' 
    ) 
        .trim() 
        .toLowerCase(); 
 
} 
 
 
/* ============================================================ 
   HELPERS — STATUS CLASS 
============================================================ */ 
 
function getStatusClass( 
    status 
) { 
 
    const normalized = 
        normalizeStatus( 
            status 
        ); 
 
 
    if ( 
        normalized === 
        'complete' 
    ) { 
 
        return 'success'; 
 
    } 
 
 
    if ( 
        normalized === 
        'incomplete' 
    ) { 
 
        return 'warning'; 
 
    } 
 
 
    return 'neutral'; 
 
} 
 
 
/* ============================================================ 
   HELPERS — HTML ESCAPE 
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
   HELPERS — ATTRIBUTE ESCAPE 
============================================================ */ 
 
function escapeHtmlAttribute( 
    value 
) { 
 
    return escapeHtml( 
        value 
    ); 
 
}
