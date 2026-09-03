/**
 * One-time setup helpers. Run these manually from the Apps Script editor
 * (select the function in the toolbar dropdown, then "Run") after pasting
 * this project in. See /gas-backend/README.md for the full walkthrough.
 */

/**
 * 1) Creates a spreadsheet (if SPREADSHEET_ID isn't already set) with the
 *    Users/SendLog/ErrorLog sheets and headers ready to go.
 * Run this first.
 */
function setupSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID");
  if (!id) {
    var ss = SpreadsheetApp.create("Future Letter 30days データ");
    props.setProperty("SPREADSHEET_ID", ss.getId());
    Logger.log("新しいスプレッドシートを作成しました: " + ss.getUrl());
  }
  usersSheet_();
  sendLogSheet_();
  errorLogSheet_();
  // Apps Script's default "Sheet1" is left empty and unused; remove it if present.
  var ss2 = getSpreadsheet_();
  var blank = ss2.getSheetByName("Sheet1");
  if (blank && ss2.getSheets().length > 1) ss2.deleteSheet(blank);
  Logger.log("シートの準備ができました。スプレッドシートURL: " + getSpreadsheet_().getUrl());
}

/**
 * 2) Sets required script properties. Fill in the placeholder values
 *    below (or set them via Project Settings > Script Properties in the
 *    editor UI) before running.
 */
function setupProperties() {
  var props = PropertiesService.getScriptProperties();
  var current = props.getProperties();
  var defaults = {
    ADMIN_PASSWORD: current.ADMIN_PASSWORD || "please-change-me",
    SITE_URL: current.SITE_URL || "https://your-username.github.io/your-repo/",
    AI_PROVIDER: current.AI_PROVIDER || "anthropic", // "anthropic" or "openai"
    AI_MODEL: current.AI_MODEL || "claude-sonnet-5",
    // AI_API_KEY intentionally left unset here — set it via the editor's
    // Project Settings > Script Properties screen so it's never pasted
    // into code / version control.
  };
  props.setProperties(defaults, false);
  Logger.log("スクリプトプロパティを設定しました。ADMIN_PASSWORDとSITE_URLは必ずご自身の値に変更してください。");
}

/**
 * 3) Installs the recurring trigger that actually sends the daily emails.
 *    Safe to re-run — it removes any existing sendDailyLetters_ trigger
 *    first so you never end up with duplicates (which would double-send).
 */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sendDailyLetters_") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sendDailyLetters_").timeBased().everyMinutes(15).create();
  Logger.log("15分ごとにsendDailyLetters_を実行するトリガーを設定しました。");
}

/** Run all three setup steps in order. */
function setupAll() {
  setupSpreadsheet();
  setupProperties();
  setupTrigger();
  Logger.log("セットアップ完了。Web Appとしてデプロイしてください（デプロイ > 新しいデプロイ > ウェブアプリ）。");
}
