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
