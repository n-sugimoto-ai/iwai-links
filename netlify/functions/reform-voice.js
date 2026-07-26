// ファイル名: reform-voice.js
// 設置場所: 既存のNetlifyリポジトリ内の "netlify/functions/reform-voice.js"
//
// 役割:
//   Instagram等のアプリ内ブラウザから直接 script.google.com を開くと
//   真っ白になる問題を回避するため、代わりにこの関数(なほさんのドメイン)へ
//   アクセスしてもらい、サーバー側でGASのexec URLを取得して中身をそのまま返す。
//   GAS側のコードや公開設定は一切変更不要。

const GAS_URL =
  "https://script.google.com/a/macros/iwai-group.net/s/AKfycbx3QZtCHhX7X8wSxGMz_PRH4hcBa-vwqWsvo6T54umnjTpDnk52ZY0P4yLc0yoTVQ42/exec";

exports.handler = async function () {
  try {
    const res = await fetch(GAS_URL, { redirect: "follow" });
    const contentType = res.headers.get("content-type") || "text/html; charset=utf-8";
    let body = await res.text();

    // ページ内の相対パス(iframeやscriptのsrcなど)が、なほさんのNetlifyドメインではなく
    // 本来のGoogle側のURLを見に行くように <base> タグを挿入する。
    // これがないと、中身のiframeが「存在しない場所」を探しに行って空白になる。
    if (contentType.includes("text/html")) {
      const finalUrl = new URL(res.url);
      const baseHref =
        finalUrl.origin + finalUrl.pathname.substring(0, finalUrl.pathname.lastIndexOf("/") + 1);

      if (/<head[^>]*>/i.test(body)) {
        body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
      } else {
        body = `<base href="${baseHref}">` + body;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        // スマホのアプリ内ブラウザにキャッシュされて古いグラフが表示され続けないようにする
        "Cache-Control": "no-store",
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body:
        "<html><body style='font-family:sans-serif;text-align:center;padding:40px;'>" +
        "<p>只今読み込みに失敗しました。<br>少し時間をおいて再度お試しください。</p>" +
        "</body></html>",
    };
  }
};
