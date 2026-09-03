/**
 * Web App entry point. The frontend POSTs here with
 * Content-Type: text/plain (see src/lib/gasBackend.js) to avoid CORS
 * preflight; the body is a JSON string { action, ...params }.
 */

function doPost(e) {
  try {
    if (!e || !e.postData) throw appError_("リクエストの形式が正しくありません。", "BAD_REQUEST");
    var body = JSON.parse(e.postData.contents);
    var data = route_(body.action, body);
    return jsonResponse_(ok_(data));
  } catch (err) {
    return jsonResponse_(fail_(err.message || "サーバーエラーが発生しました。", err.code || null));
  }
}

function doGet() {
  return ContentService.createTextOutput("Future Letter 30days API is running.").setMimeType(ContentService.MimeType.TEXT);
}

function route_(action, body) {
  switch (action) {
    case "registerUser": return registerUser_(body.payload);
    case "getSession": return getSession_(body.token);
    case "requestMagicLink": return requestMagicLink_(body.email);
    case "consumeMagicToken": return consumeMagicToken_(body.token);
    case "markLetterRead": return markLetterRead_(body.token, body.day);
    case "saveMemo": return saveMemo_(body.token, body.day, body.memo);
    case "setDeliveryStatus": return setDeliveryStatus_(body.token, body.status);
    case "changeEmail": return changeEmail_(body.token, body.newEmail);
    case "resetAccount": return resetAccount_(body.token);
    case "deleteAccount": return deleteAccount_(body.token);

    case "adminLogin": return adminLogin_(body.password);
    case "adminStats": return adminStats_(body.adminToken);
    case "adminListUsers": return adminListUsers_(body.adminToken, body.search);
    case "adminGetUser": return adminGetUser_(body.adminToken, body.userId);
    case "adminSetUserStatus": return adminSetUserStatus_(body.adminToken, body.userId, body.status);
    case "adminSendTestMail": return adminSendTestMail_(body.adminToken, body.userId, body.day);
    case "adminSendManualDay": return adminSendManualDay_(body.adminToken, body.userId, body.day);
    case "adminExportCsv": return adminExportCsv_(body.adminToken);
    case "adminResetUser": return adminResetUser_(body.adminToken, body.userId);

    case "testSetDay": return testSetDay_(body.adminToken, body.userId, body.day);
    case "testAdvanceDay": return testAdvanceDay_(body.adminToken, body.userId);

    default:
      throw appError_("未対応のactionです: " + action, "UNKNOWN_ACTION");
  }
}
