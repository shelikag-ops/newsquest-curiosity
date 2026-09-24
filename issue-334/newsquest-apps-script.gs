/**
 * NewsQuest take-home challenges: Google Sheets backend
 *
 * Paste this into Extensions > Apps Script in your Google Sheet,
 * then Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the Web app URL into CONFIG.endpoint in index.html.
 *
 * Tabs it creates automatically:
 *   Responses  one row for every answer a child gives
 *   Scores     one row per child with press points per mission
 *   Wall       Wonder Wall questions (tick "Hide" to remove one from the page)
 *   Replies    replies to Wonder Wall questions (tick "Hide" to remove)
 * Photos are saved to a Drive folder called "NewsQuest uploads".
 */

const TABS = {
  Responses: ["Received", "Reporter", "Mission", "Item", "Answer", "Correct?", "Points", "Details", "Photo", "Event ID", "Issue", "Answered at", "Session", "Score snapshot (JSON)"],
  Scores:    ["Reporter", "Total", "Quiz", "Case files", "Timeline", "Truths & fib", "Stack it", "Robot pitch", "Wonder Wall", "Last updated"],
  Wall:      ["Posted", "Reporter", "Story", "Question", "Hide", "Post ID"],
  Replies:   ["Posted", "Reporter", "Post ID", "Reply", "Hide", "Reply ID"]
};
const SCORE_KEYS = ["menti", "cases", "timeline", "fib", "stack", "robot", "wonder"];
const FOLDER_NAME = "NewsQuest uploads";

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
  Object.keys(TABS).forEach(name => tab_(ss, name));
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Run setup() from the linked spreadsheet first.");
  return SpreadsheetApp.openById(id);
}

function tab_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold");
  sh.setFrozenRows(1);
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    const ss = spreadsheet_();
    const responses = tab_(ss, "Responses");
    const existing = new Set(responses.getLastRow() > 1
      ? responses.getRange(2, 10, responses.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : []);
    const events = data.events || [];
    if (!Array.isArray(events) || events.length > 10) throw new Error("Invalid batch");
    events.forEach(ev => {
      if (!ev || !/^[a-zA-Z0-9_-]{5,100}$/.test(ev.id || "") || !String(ev.reporter || "").trim()) throw new Error("Invalid event");
      if (ev.image && String(ev.image).length > 2500000) throw new Error("Photo too large");
    });
    const saved = [];

    events.forEach(ev => {
      if (!ev || !ev.id) return;
      if (existing.has(ev.id)) { saved.push(ev.id); return; }   // already stored (retry)
      const reporter = clean_(ev.reporter || data.reporter, 60);
      let photo = "";
      if (ev.image) photo = savePhoto_(ev.image, reporter, ev.item);



      if (ev.mission === "wonder" && ev.item === "Wonder Wall question") {
        const wall = tab_(ss, "Wall");
        if (!hasId_(wall, 6, ev.id)) wall.appendRow([new Date(), reporter, clean_(ev.detail, 40), clean_(ev.answer, 1000), false, ev.id]);
        wall.getRange(wall.getLastRow(), 5).insertCheckboxes();
      }
      if (ev.mission === "wonder" && ev.item === "Reply to a friend") {
        const rep = tab_(ss, "Replies");
        if (!hasId_(rep, 6, ev.id)) rep.appendRow([new Date(), reporter, clean_(ev.postId, 60), clean_(ev.answer, 1000), false, ev.id]);
        rep.getRange(rep.getLastRow(), 5).insertCheckboxes();
      }
      if (ev.scores) upsertScore_(ss, reporter, ev.scores);
      tab_(ss, "Responses").appendRow([
        new Date(), reporter, clean_(ev.mission, 40), clean_(ev.item, 120),
        clean_(ev.answer, 2000), ev.correct === undefined ? "" : String(ev.correct),
        ev.points === undefined ? "" : ev.points, clean_(ev.detail, 500), photo, ev.id, clean_(ev.issue || "334", 40),
        clean_(ev.t, 40), clean_(ev.session, 100), JSON.stringify(ev.scores || {})
      ]);
      SpreadsheetApp.flush();
      existing.add(ev.id);
      saved.push(ev.id);
    });


    return json_({ ok: true, saved: saved });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "ping";
  if (action !== "wall") return json_({ ok: true });
  if (PropertiesService.getScriptProperties().getProperty("ENABLE_PUBLIC_WALL") !== "true") {
    return json_({ ok: true, enabled: false, posts: [] });
  }
  const ss = spreadsheet_();
  const wall = tab_(ss, "Wall").getDataRange().getValues().slice(1);
  const reps = tab_(ss, "Replies").getDataRange().getValues().slice(1);
  const byPost = {};
  reps.forEach(r => {
    if (r[4] === true) return;
    (byPost[r[2]] = byPost[r[2]] || []).push({ reporter: r[1], reply: r[3] });
  });
  const posts = wall.filter(r => r[4] !== true && r[3]).map(r => ({
    id: r[5], reporter: r[1], story: r[2], question: r[3], replies: byPost[r[5]] || []
  })).reverse();
  return json_({ ok: true, posts: posts });
}

function hasId_(sh, col, id) {
  return sh.getLastRow() > 1 && sh.getRange(2, col, sh.getLastRow()-1, 1).getValues().some(r => String(r[0]) === id);
}

function upsertScore_(ss, reporter, scores) {
  const sh = tab_(ss, "Scores");
  const names = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(r => String(r[0]).toLowerCase());
  const row = [reporter, Number(scores.total) || 0].concat(SCORE_KEYS.map(k => Math.max(0, Math.min(1000, Number(scores[k]) || 0))), [new Date()]);
  row[1] = row.slice(2, 9).reduce((a,b) => a+b, 0);
  const idx = names.indexOf(reporter.toLowerCase());
  if (idx >= 0) {
    const prior = sh.getRange(idx + 2, 1, 1, row.length).getValues()[0];
    for (let i = 2; i <= 8; i++) row[i] = Math.max(Number(prior[i]) || 0, row[i]);
    row[1] = row.slice(2, 9).reduce((a,b) => a+b, 0);
    sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  }
  else sh.appendRow(row);
}

function savePhoto_(dataUrl, reporter, item) {
  try {
    const m = String(dataUrl).match(/^data:(image\/(?:jpeg|png));base64,(.+)$/);
    if (!m) return "";
    const it = DriveApp.getFoldersByName(FOLDER_NAME);
    const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
    const name = `${reporter} - ${item} - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm")}.jpg`;
    const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name));
    return file.getUrl();
  } catch (err) {
    return "Photo could not be saved: " + err;
  }
}

function clean_(v, max) {
  if (v === undefined || v === null) return "";
  let s = String(v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;   // stop answers being read as formulas
  return s;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
