/**
 * The Gap — Google Apps Script backend
 *
 * Receives responses from the stall site and writes them into this spreadsheet.
 * Paste this whole file into Extensions > Apps Script, then Deploy > New
 * deployment > Web app, Execute as "Me", Who has access "Anyone".
 * Copy the /exec URL it gives you into the HTML file.
 */

/* Leave SHEET_ID blank when this script lives inside the spreadsheet
   (Extensions > Apps Script). Set it to the spreadsheet's id when the script
   is a standalone project (script.new) — the id is the long string in the
   sheet's URL between /d/ and /edit. */
var SHEET_ID = '';
var SHEET_NAME = 'Responses';
var QIDS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9',
            'q10','q11','q12','q13','q14','q15','q16','q17','q18'];

function book_() {
  return SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function headers_() {
  var h = ['id', 'timestamp', 'role', 'email'];
  QIDS.forEach(function (q) { h.push(q); });
  QIDS.forEach(function (q) { h.push('why_' + q); });
  return h;
}

function sheet_() {
  var ss = book_();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    var h = headers_();
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- read ---------- */

function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var h = headers_();
  var rows = sh.getRange(2, 1, last - 1, h.length).getValues();
  return rows.map(function (row) {
    var rec = { id: row[0], ts: row[1], role: row[2], email: row[3], answers: {}, why: {} };
    QIDS.forEach(function (q, i) {
      var v = row[4 + i];
      if (v === 'A' || v === 'B') rec.answers[q] = v;
    });
    QIDS.forEach(function (q, i) {
      var v = row[4 + QIDS.length + i];
      if (v) rec.why[q] = String(v);
    });
    return rec;
  }).filter(function (r) { return r.role === 'campus' || r.role === 'industry'; });
}

function doGet(e) {
  try {
    return json_({ ok: true, responses: readAll_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- write ---------- */

function addRow_(r) {
  var sh = sheet_();
  var row = [
    r.id || ('r_' + Date.now()),
    new Date(),
    r.role || '',
    r.email || ''
  ];
  var answers = r.answers || {};
  var why = r.why || {};
  QIDS.forEach(function (q) { row.push(answers[q] || ''); });
  QIDS.forEach(function (q) { row.push(why[q] || ''); });
  sh.appendRow(row);
}

function setEmail_(id, email) {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(id)) {
      sh.getRange(i + 2, 4).setValue(email);
      return;
    }
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'add') {
      addRow_(body.response || {});
    } else if (body.action === 'email') {
      setEmail_(body.id, body.email);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
