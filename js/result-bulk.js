/**
 * ============================================================
 * SCHOOL RESULTS SYSTEM
 * FILE: result-bulk.js
 *
 * Load this AFTER result-management.js:
 *   <script src="../js/result-management.js"></script>
 *   <script src="../js/result-bulk.js"></script>
 *
 * ADDS:
 * - Ready-made comment dropdowns in the single-student editor
 * - "Class Comments" screen: every student on one page, pick
 *   from dropdowns, auto-fill by average, save in ONE request
 * - "Export Class PDF" button
 * ============================================================
 */

(function () {

    'use strict';

    var CUSTOM = '__custom__';
    var MAX_LEN = 500;


    /* ========================================================
       READY-MADE COMMENTS  (edit the wording to suit your school)
       Index 0 = best band ... index 4 = weakest band
    ======================================================== */

    var TEACHER_PRESETS = [
        { label: 'Excellent', text: 'An excellent result. Keep up the good work.' },
        { label: 'Very good', text: 'A very good performance. Keep aiming higher.' },
        { label: 'Good', text: 'A good result. A little more effort will bring improvement.' },
        { label: 'Fair', text: 'A fair performance. You can do better with more commitment.' },
        { label: 'Weak', text: 'A weak result. You must work harder and pay more attention in class.' }
    ];

    var PRINCIPAL_PRESETS = [
        { label: 'Excellent', text: 'Outstanding performance. Keep it up.' },
        { label: 'Very good', text: 'A commendable result. Strive for even better.' },
        { label: 'Good', text: 'A good result. There is still room for improvement.' },
        { label: 'Fair', text: 'An average result. Work harder next term.' },
        { label: 'Weak', text: 'This result is below expectation. Serious improvement is needed.' }
    ];

    function bandIndex(average) {

        if (average === '' || average === null || average === undefined) {
            return -1;
        }

        var n = Number(average);

        if (!isFinite(n)) { return -1; }
        if (n >= 70) { return 0; }
        if (n >= 60) { return 1; }
        if (n >= 50) { return 2; }
        if (n >= 40) { return 3; }

        return 4;

    }


    /* ========================================================
       STATE
    ======================================================== */

    var lastStudents = [];
    var bulkState = {};   // studentId -> { teacher, principal }


    /* ========================================================
       STYLES
    ======================================================== */

    function injectStyles() {

        var css = [
            '.bulk-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;margin-right:12px}',
            '.bulk-btn{min-height:36px;padding:0 14px;border:1px solid var(--border);border-radius:8px;background:#fff;color:var(--text);font-size:12px;font-weight:700}',
            '.bulk-btn:hover{background:#f9fafb}',
            '.bulk-btn-primary{background:var(--primary);border-color:var(--primary);color:#fff}',
            '.bulk-btn-primary:hover{background:var(--primary-dark)}',
            '.bulk-btn:disabled{opacity:.6;cursor:not-allowed}',
            '.bulk-modal{width:min(1100px,100%)}',
            '.bulk-body{padding:18px 20px}',
            '.bulk-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:14px}',
            '.bulk-tool label{display:block;margin-bottom:6px;font-size:12px;font-weight:700}',
            '.bulk-tool-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
            '.bulk-tool-row select{flex:1;min-width:0}',
            '.bulk-check{display:flex!important;align-items:center;gap:6px;margin:0!important;font-weight:500!important;color:var(--muted)}',
            '.bulk-select,.comment-preset-select,.bulk-tool-row select{width:100%;min-height:38px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:#fff;color:var(--text);outline:none}',
            '.comment-preset-select{margin-bottom:8px}',
            '.bulk-select:focus,.comment-preset-select:focus,.bulk-custom:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,.09)}',
            '.bulk-custom{display:block;width:100%;margin-top:6px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;resize:vertical;outline:none}',
            '.bulk-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:10px}',
            '.bulk-table{width:100%;min-width:780px;border-collapse:collapse}',
            '.bulk-table th{padding:10px;background:#fafafa;border-bottom:1px solid var(--border);color:var(--muted);font-size:10px;text-align:left;text-transform:uppercase}',
            '.bulk-table td{padding:10px;border-bottom:1px solid var(--border);font-size:12px;vertical-align:top}',
            '.bulk-table tbody tr:last-child td{border-bottom:0}',
            '.bulk-sub{color:var(--muted);font-size:10px;margin-top:2px}',
            '.bulk-note{margin-bottom:12px;padding:10px 12px;border-radius:8px;background:var(--warning-bg);color:var(--warning);font-size:12px}',
            '#bulkCommentsModal .modal-actions{gap:10px;align-items:center}',
            '.bulk-status{flex:1;font-size:12px;color:var(--muted)}',
            '.bulk-status.success{color:var(--success)}',
            '.bulk-status.error{color:var(--danger)}'
        ].join('\n');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

    }


    /* ========================================================
       SHARED HELPERS
    ======================================================== */

    function shorten(text, max) {

        text = String(text || '');

        return text.length > max
            ? text.substring(0, max - 1) + '…'
            : text;

    }

    function presetOptions(presets, current) {

        var cur = String(current || '').trim();
        var matched = false;

        var html = '<option value="">Choose a ready-made comment…</option>';

        presets.forEach(function (p) {

            var selected = cur && cur === p.text;

            if (selected) { matched = true; }

            html +=
                '<option value="' + escapeHtml(p.text) + '"' +
                (selected ? ' selected' : '') + '>' +
                escapeHtml(p.label + ' — ' + shorten(p.text, 48)) +
                '</option>';

        });

        html +=
            '<option value="' + CUSTOM + '"' +
            (cur && !matched ? ' selected' : '') +
            '>Custom — type my own</option>';

        return html;

    }

    function setBulkStatus(message, type) {

        var el = document.getElementById('bulkStatus');

        if (!el) { return; }

        el.textContent = message || '';
        el.className = 'bulk-status' + (type ? ' ' + type : '');

    }


    /* ========================================================
       1. DROPDOWNS IN THE SINGLE-STUDENT EDITOR
    ======================================================== */

    function addPresetDropdown(textareaId, presets) {

        var ta = document.getElementById(textareaId);

        if (!ta) { return; }

        var select = document.createElement('select');

        select.className = 'comment-preset-select';
        select.innerHTML = presetOptions(presets, ta.value);

        select.addEventListener('change', function () {

            if (select.value === CUSTOM) {
                ta.focus();
                return;
            }

            if (!select.value) { return; }

            ta.value = select.value;

            ta.dispatchEvent(new Event('input', { bubbles: true }));

        });

        ta.parentNode.insertBefore(select, ta);

    }

    var baseRenderStudentResult = renderStudentResult;

    renderStudentResult = function (result) {

        baseRenderStudentResult(result);

        addPresetDropdown('teacherCommentInput', TEACHER_PRESETS);
        addPresetDropdown('principalCommentInput', PRINCIPAL_PRESETS);

        loadSavedComments();

    };

    function showSavedComment(inputId, displayId, presets, value, emptyText) {

        var ta = document.getElementById(inputId);
        var display = document.getElementById(displayId);

        if (ta && !String(ta.value || '').trim()) {

            ta.value = value;

            ta.dispatchEvent(new Event('input', { bubbles: true }));

            var select = ta.parentNode.querySelector('.comment-preset-select');

            if (select) {
                select.innerHTML = presetOptions(presets, value);
            }

        }

        if (display && value) {
            display.textContent = value;
        }

    }

    /*
     * Reads the saved comments straight from the Comments sheet
     * (getResultComments) every time a result is opened, so the
     * page no longer depends on the final-result call returning them.
     */

    async function loadSavedComments() {

        var studentId = currentViewedStudentId;

        if (!studentId) { return; }

        try {

            var response = await apiRequest('getResultComments', {
                schoolId: currentSession.schoolId,
                sessionId: currentSelected.sessionId,
                term: currentSelected.term,
                studentId: studentId
            });

            if (studentId !== currentViewedStudentId) { return; }

            if (
                !response ||
                !response.success ||
                !response.exists ||
                !response.comment
            ) {
                return;
            }

            var teacher = response.comment['Teacher Comment'] || '';
            var principal = response.comment['Principal Comment'] || '';

            showSavedComment(
                'teacherCommentInput', 'displayTeacherComment',
                TEACHER_PRESETS, teacher
            );

            showSavedComment(
                'principalCommentInput', 'displayPrincipalComment',
                PRINCIPAL_PRESETS, principal
            );

            if (currentViewedResult) {
                currentViewedResult.comments = response.comment;
            }

        } catch (error) {

            console.warn('Unable to load saved comments:', error);

        }

    }


    /* ========================================================
       2. CAPTURE STUDENTS + ADD TOOLBAR BUTTONS
    ======================================================== */

    var baseRenderStudents = renderStudents;

    renderStudents = function (students) {

        lastStudents = Array.isArray(students) ? students : [];

        baseRenderStudents(students);

        ensureToolbar();

    };

    function ensureToolbar() {

        if (document.getElementById('bulkToolbar')) { return; }

        var header = document.querySelector('#studentsSection .panel-header');
        var count = document.getElementById('recordCount');

        if (!header) { return; }

        var box = document.createElement('div');

        box.id = 'bulkToolbar';
        box.className = 'bulk-toolbar';

        box.innerHTML =
            '<button type="button" class="bulk-btn" id="openBulkCommentsButton">Class Comments</button>' +
            '<button type="button" class="bulk-btn bulk-btn-primary" id="exportClassPdfButton">Export Class PDF</button>';

        header.insertBefore(box, count);

        document.getElementById('openBulkCommentsButton')
            .addEventListener('click', openBulkComments);

        document.getElementById('exportClassPdfButton')
            .addEventListener('click', exportClassPdf);

    }


    /* ========================================================
       3. CLASS COMMENTS SCREEN
    ======================================================== */

    function buildBulkModal() {

        if (document.getElementById('bulkCommentsModal')) { return; }

        var presetList = function (presets) {

            return '<option value="">Choose…</option>' +
                presets.map(function (p) {
                    return '<option value="' + escapeHtml(p.text) + '">' +
                        escapeHtml(p.label + ' — ' + shorten(p.text, 40)) +
                        '</option>';
                }).join('');

        };

        var wrap = document.createElement('div');

        wrap.className = 'modal-backdrop hidden';
        wrap.id = 'bulkCommentsModal';

        wrap.innerHTML =
            '<div class="modal bulk-modal" role="dialog" aria-modal="true">' +

                '<div class="modal-header">' +
                    '<div><div class="eyebrow">CLASS COMMENTS</div>' +
                    '<h2 id="bulkTitle">Enter comments</h2></div>' +
                    '<button type="button" class="modal-close" id="bulkClose" aria-label="Close">×</button>' +
                '</div>' +

                '<div class="bulk-body">' +

                    '<div class="bulk-tools">' +

                        '<div class="bulk-tool"><label>Teacher comment for everyone</label>' +
                        '<div class="bulk-tool-row"><select id="bulkAllTeacher">' + presetList(TEACHER_PRESETS) + '</select>' +
                        '<button type="button" class="bulk-btn" id="bulkApplyTeacher">Apply to all</button></div></div>' +

                        '<div class="bulk-tool"><label>Principal comment for everyone</label>' +
                        '<div class="bulk-tool-row"><select id="bulkAllPrincipal">' + presetList(PRINCIPAL_PRESETS) + '</select>' +
                        '<button type="button" class="bulk-btn" id="bulkApplyPrincipal">Apply to all</button></div></div>' +

                        '<div class="bulk-tool"><label>Pick by each student\'s average</label>' +
                        '<div class="bulk-tool-row"><button type="button" class="bulk-btn" id="bulkAutoFill">Auto-fill both</button>' +
                        '<label class="bulk-check"><input type="checkbox" id="bulkReplace"> Replace existing</label></div></div>' +

                    '</div>' +

                    '<div class="bulk-note hidden" id="bulkNote"></div>' +

                    '<div class="bulk-table-wrap"><table class="bulk-table">' +
                        '<thead><tr><th>Student</th><th>Avg</th><th>Teacher\'s comment</th><th>Principal\'s comment</th></tr></thead>' +
                        '<tbody id="bulkRows"></tbody>' +
                    '</table></div>' +

                '</div>' +

                '<div class="modal-actions">' +
                    '<span class="bulk-status" id="bulkStatus"></span>' +
                    '<button type="button" class="secondary-button" id="bulkCancel">Close</button>' +
                    '<button type="button" class="bulk-btn bulk-btn-primary" id="bulkSave">Save all comments</button>' +
                '</div>' +

            '</div>';

        document.body.appendChild(wrap);


        var close = function () { wrap.classList.add('hidden'); };

        document.getElementById('bulkClose').addEventListener('click', close);
        document.getElementById('bulkCancel').addEventListener('click', close);

        wrap.addEventListener('click', function (e) {
            if (e.target === wrap) { close(); }
        });

        document.getElementById('bulkApplyTeacher').addEventListener('click', function () {
            applyToAll('teacher', document.getElementById('bulkAllTeacher').value);
        });

        document.getElementById('bulkApplyPrincipal').addEventListener('click', function () {
            applyToAll('principal', document.getElementById('bulkAllPrincipal').value);
        });

        document.getElementById('bulkAutoFill').addEventListener('click', autoFillByAverage);

        document.getElementById('bulkSave').addEventListener('click', saveBulkComments);


        var rows = document.getElementById('bulkRows');

        rows.addEventListener('change', function (e) {

            var select = e.target;

            if (!select.classList.contains('bulk-select')) { return; }

            var id = select.closest('tr').getAttribute('data-id');
            var kind = select.getAttribute('data-kind');
            var custom = select.parentNode.querySelector('.bulk-custom');

            if (select.value === CUSTOM) {

                custom.classList.remove('hidden');
                custom.focus();
                setState(id, kind, custom.value);

            } else {

                custom.classList.add('hidden');
                custom.value = '';
                setState(id, kind, select.value);

            }

        });

        rows.addEventListener('input', function (e) {

            if (!e.target.classList.contains('bulk-custom')) { return; }

            setState(
                e.target.closest('tr').getAttribute('data-id'),
                e.target.getAttribute('data-kind'),
                e.target.value
            );

        });

    }

    function setState(id, kind, value) {

        id = String(id);

        if (!bulkState[id]) {
            bulkState[id] = { teacher: '', principal: '' };
        }

        bulkState[id][kind] = String(value || '');

    }

    function commentCell(kind, presets, value) {

        var cur = String(value || '').trim();

        var isCustom = cur && !presets.some(function (p) {
            return p.text === cur;
        });

        return (
            '<select class="bulk-select" data-kind="' + kind + '">' +
                presetOptions(presets, cur) +
            '</select>' +
            '<textarea class="bulk-custom' + (isCustom ? '' : ' hidden') + '" ' +
                'data-kind="' + kind + '" maxlength="' + MAX_LEN + '" rows="2" ' +
                'placeholder="Type comment...">' +
                (isCustom ? escapeHtml(cur) : '') +
            '</textarea>'
        );

    }

    function renderBulkRows() {

        var body = document.getElementById('bulkRows');

        if (!body) { return; }

        body.innerHTML = lastStudents.map(function (s) {

            var st = bulkState[String(s.studentId)] || { teacher: '', principal: '' };

            return (
                '<tr data-id="' + escapeHtmlAttribute(s.studentId) + '">' +
                    '<td><strong>' + escapeHtml(s.fullName || '') + '</strong>' +
                        '<div class="bulk-sub">' + escapeHtml(s.admissionNo || '') + '</div></td>' +
                    '<td>' + escapeHtml(formatNumberValue(s.average)) + '</td>' +
                    '<td>' + commentCell('teacher', TEACHER_PRESETS, st.teacher) + '</td>' +
                    '<td>' + commentCell('principal', PRINCIPAL_PRESETS, st.principal) + '</td>' +
                '</tr>'
            );

        }).join('');

    }

    function applyToAll(kind, text) {

        if (!text) { return; }

        lastStudents.forEach(function (s) {
            setState(s.studentId, kind, text);
        });

        renderBulkRows();

        setBulkStatus('Applied to all students. Review, then save.', '');

    }

    function autoFillByAverage() {

        var replace = document.getElementById('bulkReplace').checked;

        lastStudents.forEach(function (s) {

            var i = bandIndex(s.average);

            if (i < 0) { return; }

            var id = String(s.studentId);
            var st = bulkState[id] || { teacher: '', principal: '' };

            if (replace || !st.teacher) {
                setState(id, 'teacher', TEACHER_PRESETS[i].text);
            }

            if (replace || !st.principal) {
                setState(id, 'principal', PRINCIPAL_PRESETS[i].text);
            }

        });

        renderBulkRows();

        setBulkStatus('Filled from averages. Adjust any row, then save.', '');

    }

    async function openBulkComments() {

        if (
            !currentSelected.sessionId ||
            !currentSelected.term ||
            !currentSelected.classId ||
            !lastStudents.length
        ) {

            showPageMessage('Select a session, term and class with students first.');

            return;

        }

        buildBulkModal();

        var modal = document.getElementById('bulkCommentsModal');
        var note = document.getElementById('bulkNote');

        note.classList.add('hidden');

        setText(
            'bulkTitle',
            buildClassName(currentOverview && currentOverview.class) + ' — Comments'
        );

        bulkState = {};

        lastStudents.forEach(function (s) {
            bulkState[String(s.studentId)] = { teacher: '', principal: '' };
        });

        renderBulkRows();

        modal.classList.remove('hidden');

        setBulkStatus('Loading saved comments...', '');

        try {

            var response = await apiRequest('getClassResultComments', {
                schoolId: currentSession.schoolId,
                sessionId: currentSelected.sessionId,
                term: currentSelected.term,
                classId: currentSelected.classId
            });

            if (!response || !response.success) {
                throw new Error(
                    response && response.error
                        ? response.error
                        : 'Unable to load saved comments.'
                );
            }

            (response.students || []).forEach(function (s) {

                var id = String(s.studentId);

                if (bulkState[id] && s.comment) {
                    bulkState[id].teacher = s.comment['Teacher Comment'] || '';
                    bulkState[id].principal = s.comment['Principal Comment'] || '';
                }

            });

            renderBulkRows();

            setBulkStatus('', '');

        } catch (error) {

            console.error('Load bulk comments error:', error);

            note.textContent =
                'Could not load saved comments (' +
                (error.message || 'unknown error') +
                '). You can still enter new ones.';

            note.classList.remove('hidden');

            setBulkStatus('', '');

        }

    }

    async function saveBulkComments() {

        var items = [];

        for (var i = 0; i < lastStudents.length; i++) {

            var s = lastStudents[i];
            var st = bulkState[String(s.studentId)] || {};

            var teacher = String(st.teacher || '').trim();
            var principal = String(st.principal || '').trim();

            if (!teacher && !principal) { continue; }

            if (teacher.length > MAX_LEN || principal.length > MAX_LEN) {

                setBulkStatus(
                    (s.fullName || 'A student') +
                    ' has a comment over ' + MAX_LEN + ' characters.',
                    'error'
                );

                return;

            }

            items.push({
                studentId: s.studentId,
                teacherComment: teacher,
                principalComment: principal
            });

        }

        if (!items.length) {
            setBulkStatus('Nothing to save yet.', 'error');
            return;
        }

        var button = document.getElementById('bulkSave');

        button.disabled = true;
        button.textContent = 'Saving...';

        setBulkStatus('Saving ' + items.length + ' comments...', '');

        try {

            var response = await apiRequest('saveBulkResultComments', {
                schoolId: currentSession.schoolId,
                sessionId: currentSelected.sessionId,
                term: currentSelected.term,
                items: items,
                updatedBy:
                    currentSession.fullName ||
                    currentSession.userId ||
                    'System User'
            });

            if (!response || !response.success) {
                throw new Error(
                    response && response.error
                        ? response.error
                        : 'Unable to save comments.'
                );
            }

            setBulkStatus(
                response.message || 'Comments saved successfully.',
                'success'
            );

        } catch (error) {

            console.error('Save bulk comments error:', error);

            setBulkStatus(error.message || 'Unable to save comments.', 'error');

        } finally {

            button.disabled = false;
            button.textContent = 'Save all comments';

        }

    }


    /* ========================================================
       4. EXPORT CLASS PDF
    ======================================================== */

    async function exportClassPdf() {

        if (
            !currentSelected.sessionId ||
            !currentSelected.term ||
            !currentSelected.classId
        ) {

            showPageMessage('Select a session, term and class first.');

            return;

        }

        var overview = currentOverview || {};
        var validation = overview.validation || {};

        var ready =
            overview.readyForPdf === true ||
            validation.ready === true;

        if (
            !ready &&
            !window.confirm(
                'Some results in this class are incomplete. Export anyway?'
            )
        ) {
            return;
        }

        var button = document.getElementById('exportClassPdfButton');

        if (button) {
            button.disabled = true;
            button.textContent = 'Preparing PDF...';
        }

        try {

            var response = await apiRequest('generateClassResultsPdf', {
                schoolId: currentSession.schoolId,
                sessionId: currentSelected.sessionId,
                term: currentSelected.term,
                classId: currentSelected.classId
            });

            if (!response || !response.success) {
                throw new Error(
                    response && response.error
                        ? response.error
                        : 'The class results PDF could not be generated.'
                );
            }

            // Single merged file, or a Drive folder of per-student PDFs
            var url =
                (response.file &&
                    (response.file.url || response.file.downloadUrl)) ||
                (response.folder && response.folder.url);

            if (!url) {
                throw new Error('The PDF was generated, but no link was returned.');
            }

            var note =
                response.message || 'Class results PDF generated successfully.';

            if (response.generatedCount !== undefined) {

                note =
                    response.generatedCount + ' result PDF' +
                    (Number(response.generatedCount) === 1 ? '' : 's') +
                    ' generated' +
                    (Number(response.failedCount) > 0
                        ? ', ' + response.failedCount + ' failed.'
                        : '.');

            }

            showPageMessage(note);

            window.open(url, '_blank');

        } catch (error) {

            console.error('Class PDF error:', error);

            showPageMessage(
                error.message || 'Unable to generate the class results PDF.'
            );

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent = 'Export Class PDF';
            }

        }

    }


    injectStyles();

    console.log('result-bulk.js loaded');

})();
