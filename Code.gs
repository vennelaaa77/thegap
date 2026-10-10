/**
 * The Gap — Google Apps Script backend
 *
 * Receives responses from the stall site and writes them into this spreadsheet.
 * Paste this whole file into Extensions > Apps Script, then Deploy > New
 * deployment > Web app, Execute as "Me", Who has access "Anyone".
 * Copy the /exec URL it gives you into the HTML file.
 */

var SHEET_NAME = 'Responses';
var QIDS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9',
            'q10','q11','q12','q13','q14','q15','q16','q17','q18'];

function headers_() {
  var h = ['id', 'timestamp', 'role', 'email'];
  QIDS.forEach(function (q) { h.push(q); });
  QIDS.forEach(function (q) { h.push('why_' + q); });
  return h;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

/* ---------- optional: one-click mailout of the report ---------- */

/**
 * Run this by hand from the Apps Script editor once your report is ready.
 * Put the report link in REPORT_LINK first. It mails every address in the
 * sheet, once each, and writes "sent" into a Sent column so a re-run skips them.
 */
var REPORT_LINK = 'https://your-report-link-here';
var SUBJECT = 'The Gap — campus vs industry, the findings';

function mailTheReport() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return;

  var h = headers_();
  var sentCol = h.length + 1;
  if (sh.getRange(1, sentCol).getValue() !== 'sent') {
    sh.getRange(1, sentCol).setValue('sent').setFontWeight('bold');
  }

  var emails = sh.getRange(2, 4, last - 1, 1).getValues();
  var sent = sh.getRange(2, sentCol, last - 1, 1).getValues();
  var done = {};

  for (var i = 0; i < emails.length; i++) {
    var addr = String(emails[i][0] || '').trim();
    if (!addr || sent[i][0] === 'yes' || done[addr]) continue;
    MailApp.sendEmail({
      to: addr,
      subject: SUBJECT,
      htmlBody:
        '<p>Thanks for taking part in The Gap at GLC 4.0.</p>' +
        '<p>The full campus-versus-industry findings are here: ' +
        '<a href="' + REPORT_LINK + '">' + REPORT_LINK + '</a></p>' +
        '<p>— Marketing Club, TAPMI</p>'
    });
    sh.getRange(i + 2, sentCol).setValue('yes');
    done[addr] = true;
  }
}
