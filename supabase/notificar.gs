// Nuestro Radar · aviso por correo cuando alguien escribe en el Muro.
// Va en Google Apps Script (script.google.com) con la cuenta de Luis.
// Supabase lo llama (Database Webhook) cada vez que se inserta un mensaje en "muro".
//
// ⚠️ Cambia TOKEN por una palabra inventada (sin espacios) y usa la misma
//    al final de la URL del webhook en Supabase:  ...exec?token=TU_PALABRA

var TOKEN = "CAMBIA_ESTA_PALABRA";
var PAGINA = "https://luisfonse.github.io/nuestro-radar/#muro";
var LUIS = "luisfonsecasantana@gmail.com";
var JOCELYN = "jsgmmanquilepe@gmail.com";

function doPost(e) {
  if (!e || !e.parameter || e.parameter.token !== TOKEN) return salida("no");
  var datos = JSON.parse(e.postData.contents || "{}");
  if (datos.type !== "INSERT" || !datos.record) return salida("ignorado");
  var r = datos.record;

  var deJocelyn = r.firma === "La Sonrisita";
  var para = deJocelyn ? LUIS : JOCELYN;
  var quien = deJocelyn ? "💗 La Sonrisita" : "💻 El Fonseca";
  var color = deJocelyn ? "#c2456b" : "#1f6f8b";
  var texto = String(r.texto || "").slice(0, 300);
  if (String(r.texto || "").length > 300) texto += "…";
  var tema = r.tema || "General";

  var html =
    '<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#12394a">' +
    '<div style="background:#12394a;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">' +
    '<div style="font-size:13px;color:#e8a33a">📡 Nuestro Radar · Muro</div>' +
    '<div style="font-size:20px;font-weight:bold;margin-top:4px">' + quien + ' te dejó un mensaje</div></div>' +
    '<div style="border:1px solid #e3e8ea;border-top:none;border-radius:0 0 12px 12px;padding:18px 20px">' +
    '<div style="font-size:12px;color:#7a888d;margin-bottom:8px">Tema: <b>' + esc(tema) + '</b></div>' +
    '<div style="border-left:4px solid ' + color + ';background:#f7f9fa;padding:12px 14px;border-radius:6px;font-size:15px;line-height:1.5;white-space:pre-wrap">' + esc(texto) + '</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 6px;"><tr>' +
    '<td align="center" bgcolor="#e8a33a" style="background-color:#e8a33a;border-radius:28px;">' +
    '<a href="' + PAGINA + '" target="_blank" style="display:block;padding:14px 30px;font-size:16px;font-weight:bold;color:#12394a;text-decoration:none;border-radius:28px;">💬 Ver en el Muro</a>' +
    '</td></tr></table>' +
    '<div style="text-align:center;font-size:12px;color:#7a888d">o entra a <a href="' + PAGINA + '" style="color:#1f6f8b">luisfonse.github.io/nuestro-radar</a></div>' +
    '</div></div>';

  MailApp.sendEmail({
    to: para,
    subject: "💬 " + (deJocelyn ? "La Sonrisita" : "El Fonseca") + " escribió en el Muro · " + tema,
    body: quien + " escribió en el Muro (" + tema + "):\n\n" + texto + "\n\nVer en el Muro: " + PAGINA,
    htmlBody: html,
    name: "Nuestro Radar"
  });
  return salida("ok");
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function salida(t) { return ContentService.createTextOutput(t); }

// Para dar permisos la primera vez: ejecuta esta función una vez desde el editor.
function probar() {
  MailApp.sendEmail(LUIS, "📡 Prueba de avisos del Muro", "Si te llegó esto, los avisos funcionan.");
}
