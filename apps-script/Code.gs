/**
 * Floral Image Canberra — Agent Gifting backend
 * ------------------------------------------------
 * Receives submissions from the gifting pages, writes them to ONE Google
 * Sheet ("Floral Image Canberra — Agent Gifts", auto-created in your Drive
 * on the first submission), and sends:
 *   1. a notification email to NOTIFY_EMAIL for every submission
 *   2. a confirmation email to the agent who submitted
 *
 * Deploy (see SETUP.md): Deploy → New deployment → Web app →
 * Execute as: Me · Who has access: Anyone → copy the /exec URL.
 */

var NOTIFY_EMAIL = "canberra@floralimage.com";
var SHEET_NAME = "Floral Image Canberra — Agent Gifts";
var MAX_LEN = 500; // hard cap on any single field
var DASH_PIN = "flowers26"; // shared PIN for the growth dashboard — change it here if you like

/**
 * RUN ME ONCE from the editor (Run ▸ authorize) to grant permissions,
 * create the Google Sheet, and seed the 30-task growth dashboard.
 */
function authorize() {
  tasksSheet_(); // creates the Sheet + seeds dashboard tasks (Sheets permission)
  var quota = MailApp.getRemainingDailyQuota(); // touches the email permission
  Logger.log("All good — Sheet ready, email quota today: " + quota);
}

// ---------------------------------------------------------------- entrypoints

function doGet() {
  return json_({ ok: true, service: "floral-image-agent-gifts", time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var data = parseBody_(e);
    if (!data || !data.type) return json_({ ok: false, error: "empty" });
    data = sanitise_(data);

    if (data.type === "gift") return handleGift_(data);
    if (data.type === "agent_signup") return handleSignup_(data);
    if (data.type === "referral") return handleReferral_(data);
    if (data.type === "task_list") return handleTaskList_(data);
    if (data.type === "task_toggle") return handleTaskToggle_(data);
    if (data.type === "task_add") return handleTaskAdd_(data);
    return json_({ ok: false, error: "unknown-type" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ---------------------------------------------------------------- handlers

function handleGift_(d) {
  var sheet = getTab_("Gifts", [
    "Logged", "Occasion", "Agent", "Agency", "Agent email", "Agent mobile",
    "Client", "Client phone", "Delivery address", "Move-in date",
    "Card message", "Intro script", "Agent slug", "Status",
  ]);
  sheet.appendRow([
    new Date(), d.occasion || "home", d.agent_name, d.agency, d.agent_email,
    d.agent_mobile, d.client_name, d.client_phone, d.client_address,
    d.move_in, d.card_message, d.intro_script, d.agent_slug, "NEW",
  ]);

  var what = d.occasion === "office" ? "new office" : "new home";
  var sheetUrl = SpreadsheetApp.openById(props_().getProperty("SS_ID")).getUrl();

  // 1 — notify Floral Image
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "🌿 New agent gift — " + d.agent_name + " (" + d.agency + ") → " + d.client_name,
    htmlBody:
      h2_("New gift to deliver") +
      row_("Occasion", what) +
      row_("Agent", d.agent_name + " · " + d.agency + " · " + d.agent_email + (d.agent_mobile ? " · " + d.agent_mobile : "")) +
      row_("Client", d.client_name) +
      row_("Client phone", '<a href="tel:' + d.client_phone + '">' + d.client_phone + "</a>") +
      row_("Deliver to", d.client_address) +
      row_("Move-in", d.move_in || "—") +
      row_("Card message", '"' + d.card_message + '"') +
      row_("Say on the phone", d.intro_script || "(default)") +
      row_("Page", d.agent_slug) +
      '<p style="margin-top:16px"><a href="' + sheetUrl + '">Open the gifts sheet →</a></p>' +
      foot_("Action: call the client, lock a delivery day, set Status to SCHEDULED."),
  });

  // 2 — confirm to the agent
  if (validEmail_(d.agent_email)) {
    var first = String(d.client_name || "").split(" ")[0] || "your client";
    MailApp.sendEmail({
      to: d.agent_email,
      subject: "Your welcome gift for " + d.client_name + " is being arranged 🌿",
      htmlBody:
        h2_("Lovely work, " + (String(d.agent_name || "").split(" ")[0] || "there") + ".") +
        p_("Your welcome gift for <b>" + d.client_name + "</b> (" + what + ") is logged with our delivery team.") +
        p_("<b>What happens next:</b> we'll phone " + first + " to find the best delivery time, hand-deliver a designer arrangement with your card, and email you the moment it's done.") +
        p_('Your card will read:<br><i>"' + d.card_message + '"<br>— ' + d.agent_name + ", " + d.agency + "</i>") +
        p_("As always: we call first, it's completely free, and there's never a hard sell — this is your gift to them.") +
        foot_("Floral Image Canberra · Mitchell ACT · canberra@floralimage.com"),
    });
  }
  return json_({ ok: true });
}

function handleSignup_(d) {
  var sheet = getTab_("Agent Signups", ["Received", "Agent", "Agency", "Email", "Mobile", "Page created?"]);
  sheet.appendRow([new Date(), d.agent_name, d.agency, d.agent_email, d.agent_mobile, "NO"]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "🌿 New agent signup — " + d.agent_name + " (" + d.agency + ")",
    htmlBody:
      h2_("New agent wants a gifting page") +
      row_("Agent", d.agent_name) +
      row_("Agency", d.agency) +
      row_("Email", d.agent_email) +
      row_("Mobile", d.agent_mobile || "—") +
      foot_("Action: run ./add-agent.sh, ask for their logo, and email them their link."),
  });

  if (validEmail_(d.agent_email)) {
    MailApp.sendEmail({
      to: d.agent_email,
      subject: "Your Floral Image gifting page is on its way 🌿",
      htmlBody:
        h2_("Welcome aboard, " + (String(d.agent_name || "").split(" ")[0] || "there") + ".") +
        p_("We're setting up your personal gifting page now — you'll get your link shortly (usually the same day).") +
        p_("<b>Want your logo on your page and cards?</b> Just reply to this email with a PNG or SVG and we'll have it on there same day.") +
        p_("From then on: log a gift in sixty seconds, we phone your client, hand-deliver designer flowers with your card — free, every time.") +
        foot_("Floral Image Canberra · Mitchell ACT · canberra@floralimage.com"),
    });
  }
  return json_({ ok: true });
}

function handleReferral_(d) {
  var sheet = getTab_("Referrals", [
    "Received", "Referrer", "Referrer business", "Referrer email",
    "Referred business", "Referred contact", "Referred phone", "Referred email",
    "Note", "Source", "Status", "Reward given?",
  ]);
  sheet.appendRow([
    new Date(), d.referrer_name, d.referrer_company, d.referrer_email,
    d.referred_company, d.referred_contact, d.referred_phone, d.referred_email,
    d.note, d.source, "NEW", "NO",
  ]);

  var sheetUrl = SpreadsheetApp.openById(props_().getProperty("SS_ID")).getUrl();

  // 1 — notify Floral Image
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "🌿 New referral — " + d.referrer_company + " → " + d.referred_company,
    htmlBody:
      h2_("New referral to chase") +
      row_("Referrer", d.referrer_name + " · " + d.referrer_company + " · " + d.referrer_email) +
      row_("Referred business", d.referred_company) +
      row_("Contact", d.referred_contact || "—") +
      row_("Phone", d.referred_phone ? '<a href="tel:' + d.referred_phone + '">' + d.referred_phone + "</a>" : "—") +
      row_("Email", d.referred_email || "—") +
      row_("Note", d.note || "—") +
      row_("Source", d.source || "direct") +
      '<p style="margin-top:16px"><a href="' + sheetUrl + '">Open the Referrals sheet →</a></p>' +
      foot_("Action: book their free trial + mention " + d.referrer_name + " sent us. When they convert: set Status=WON, credit the free month, set Reward given?=YES."),
  });

  // 2 — thank the referrer
  if (validEmail_(d.referrer_email)) {
    MailApp.sendEmail({
      to: d.referrer_email,
      subject: "You beauty — your referral of " + d.referred_company + " is in 🌿",
      htmlBody:
        h2_("Thank you, " + (String(d.referrer_name || "").split(" ")[0] || "there") + ".") +
        p_("Your referral of <b>" + d.referred_company + "</b> just landed with our team.") +
        p_("<b>What happens next:</b> we'll reach out to them this week with a friendly free trial (and mention you sent us — unless your note says otherwise). The moment they become a client, <b>your next month of flowers is free</b> and you'll get an email confirming it.") +
        p_("Every referral that joins is another free month for you — there's no cap. Keep them coming.") +
        foot_("Floral Image Canberra · Mitchell ACT · canberra@floralimage.com"),
    });
  }
  return json_({ ok: true });
}

// ---------------------------------------------------------------- dashboard

var TASK_HEADERS = ["ID", "Phase", "Task", "Owner", "Done", "Done by", "Done at", "Added"];

// Seeded once, the first time the dashboard loads. After that the Sheet is the
// single source of truth — add/edit/reorder rows there or from the dashboard.
var SEED_TASKS = [
  ["Backend live", "Deploy this Apps Script + paste the /exec URL into config.js", "Aaron"],
  ["Backend live", "Wire ENDPOINT, bump cache-buster to v=3, redeploy site", "Claude"],
  ["Backend live", "End-to-end test: gift + referral + dashboard tick", "Claude"],
  ["RE gifting portal", "Design tweaks on portal pages", "Sam"],
  ["RE gifting portal", "Agent pitch one-pager PDF", "Claude"],
  ["RE gifting portal", "Recruit first 10 agents / property managers", "Aaron"],
  ["RE gifting portal", "First real gift delivered", "Team"],
  ["RE gifting portal", "25 agents onboard", "Aaron"],
  ["Referral engine", "Send 'Referral Launch' Klaviyo campaign (draft ready)", "Aaron"],
  ["Referral engine", "Print QR referral cards (qr-cards.pdf)", "Aaron"],
  ["Referral engine", "Brief drivers: leave a card with every refresh", "Aaron"],
  ["Referral engine", "Post-refresh referral moment flow in Klaviyo", "Claude"],
  ["Referral engine", "First referral submitted", "Team"],
  ["Email foundation", "Send 'Sunset' campaign to 5,441 disengaged (draft ready)", "Aaron"],
  ["Email foundation", "Suppress sunset non-responders (14 days after send)", "Claude"],
  ["Email foundation", "Email list validation pass (~$80)", "Aaron"],
  ["Email foundation", "Rebuild + switch on Corporate & Home welcome flows", "Claude"],
  ["Email foundation", "Conversion events wired: Submitted Form → Trial → Paid Signup", "Claude"],
  ["Home market", "Decide payment rail: Stripe vs Square ($22 trial)", "Aaron"],
  ["Home market", "Build $22 two-week trial landing page", "Claude"],
  ["Home market", "Post-trial email sequence (day 0/3/9/13/14)", "Claude"],
  ["Home market", "Link Higgsfield connector for ad creative", "Aaron"],
  ["Home market", "Ad creative set (5 concepts)", "Claude"],
  ["Home market", "Meta campaign live at $40/day", "Team"],
  ["Home market", "Seasonal tier ladder priced + published ($147/$197/$247)", "Aaron"],
  ["Win-back & expansion", "Corporate win-back wave 1 (after validation)", "Claude"],
  ["Win-back & expansion", "Anniversary prepay flow (12 for 11)", "Claude"],
  ["Win-back & expansion", "Second-arrangement upsell push", "Claude"],
  ["Decisions", "Confirm corporate ARPU + monthly churn numbers", "Aaron"],
  ["Decisions", "Ad budget sign-off (~$1,200/mo Meta + $500/mo Google)", "Aaron"],
];

function tasksSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName("Tasks");
  if (!sheet) {
    sheet = ss.insertSheet("Tasks");
    sheet.appendRow(TASK_HEADERS);
    sheet.getRange(1, 1, 1, TASK_HEADERS.length).setFontWeight("bold").setBackground("#E7EEE8");
    sheet.setFrozenRows(1);
    var now = new Date();
    SEED_TASKS.forEach(function (t, i) {
      sheet.appendRow(["t" + (i + 1), t[0], t[1], t[2], "NO", "", "", now]);
    });
    props_().setProperty("TASK_COUNTER", String(SEED_TASKS.length));
  }
  return sheet;
}

function checkPin_(d) { return String(d.pin || "") === DASH_PIN; }

function handleTaskList_(d) {
  if (!checkPin_(d)) return json_({ ok: false, error: "bad-pin" });
  var rows = tasksSheet_().getDataRange().getValues();
  var tasks = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    tasks.push({
      id: String(rows[i][0]), phase: rows[i][1], task: rows[i][2], owner: rows[i][3],
      done: String(rows[i][4]).toUpperCase() === "YES",
      done_by: rows[i][5], done_at: rows[i][6] ? new Date(rows[i][6]).toISOString() : "",
    });
  }
  return json_({ ok: true, tasks: tasks });
}

function handleTaskToggle_(d) {
  if (!checkPin_(d)) return json_({ ok: false, error: "bad-pin" });
  var sheet = tasksSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(d.id)) {
      var done = !!d.done;
      sheet.getRange(i + 1, 5, 1, 3).setValues([[done ? "YES" : "NO", done ? (d.who || "") : "", done ? new Date() : ""]]);
      return json_({ ok: true });
    }
  }
  return json_({ ok: false, error: "task-not-found" });
}

function handleTaskAdd_(d) {
  if (!checkPin_(d)) return json_({ ok: false, error: "bad-pin" });
  if (!d.task) return json_({ ok: false, error: "empty-task" });
  var sheet = tasksSheet_();
  var n = Number(props_().getProperty("TASK_COUNTER") || sheet.getLastRow()) + 1;
  props_().setProperty("TASK_COUNTER", String(n));
  var id = "t" + n;
  sheet.appendRow([id, d.phase || "General", d.task, d.owner || "Team", "NO", "", "", new Date()]);
  return json_({ ok: true, id: id });
}

// ---------------------------------------------------------------- plumbing

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    if (e.parameter && e.parameter.payload) raw = e.parameter.payload; // FormData fallback
    try { return JSON.parse(raw); } catch (_) {}
    try { return JSON.parse(e.parameter.payload || "{}"); } catch (_) {}
  }
  if (e && e.parameter && e.parameter.payload) {
    try { return JSON.parse(e.parameter.payload); } catch (_) {}
  }
  return null;
}

function sanitise_(d) {
  var out = {};
  Object.keys(d).forEach(function (k) {
    var v = d[k];
    out[k] = typeof v === "string" ? v.replace(/<[^>]*>/g, "").slice(0, MAX_LEN) : v;
  });
  return out;
}

function props_() { return PropertiesService.getScriptProperties(); }

function getSpreadsheet_() {
  var id = props_().getProperty("SS_ID");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (_) {} }
  var ss = SpreadsheetApp.create(SHEET_NAME);
  props_().setProperty("SS_ID", ss.getId());
  return ss;
}

function getTab_(name, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E7EEE8");
    sheet.setFrozenRows(1);
  }
  var d = ss.getSheetByName("Sheet1");
  if (d && ss.getSheets().length > 1) ss.deleteSheet(d);
  return sheet;
}

function validEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "")); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// email building blocks
function h2_(t) { return '<h2 style="font-family:Georgia,serif;color:#2C5A40;margin:0 0 12px">' + t + "</h2>"; }
function p_(t) { return '<p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1D2620;line-height:1.55;margin:0 0 12px">' + t + "</p>"; }
function row_(k, v) {
  return '<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;margin:0 0 6px"><b style="color:#5C685E">' + k + ":</b> " + (v || "—") + "</p>";
}
function foot_(t) {
  return '<p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#5C685E;border-top:1px solid #DCE2D8;margin-top:18px;padding-top:10px">' + t + "</p>";
}
