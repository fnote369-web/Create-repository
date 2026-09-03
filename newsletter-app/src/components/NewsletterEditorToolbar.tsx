"use client";

// テキストエリアに、画像・リンク・ボタンのHTMLを挿入するだけの簡単なツールバー。
// 難しいエディタライブラリを使わず、初心者でも「ボタンを押すだけ」で
// HTMLメールの部品を挿入できるようにしている。

function insertAtCursor(targetId: string, snippet: string) {
  const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, start) + snippet + el.value.slice(end);
  el.focus();
  const pos = start + snippet.length;
  el.setSelectionRange(pos, pos);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function NewsletterEditorToolbar({ targetId }: { targetId: string }) {
  function insertImage() {
    const url = window.prompt("画像のURLを入力してください");
    if (!url) return;
    const alt = window.prompt("画像の説明（省略可）") ?? "";
    insertAtCursor(targetId, `\n<img src="${url}" alt="${alt}" style="max-width:100%;" />\n`);
  }

  function insertLink() {
    const url = window.prompt("リンク先のURLを入力してください");
    if (!url) return;
    const text = window.prompt("リンクの文字（省略可）") || url;
    insertAtCursor(targetId, `<a href="${url}">${text}</a>`);
  }

  function insertButton() {
    const url = window.prompt("ボタンのリンク先URLを入力してください");
    if (!url) return;
    const text = window.prompt("ボタンの文字") || "こちら";
    insertAtCursor(
      targetId,
      `\n<a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">${text}</a>\n`
    );
  }

  return (
    <div className="flex gap-2 mb-2">
      <button type="button" onClick={insertImage} className="btn-secondary !py-1 !px-3 text-xs">
        画像を挿入
      </button>
      <button type="button" onClick={insertLink} className="btn-secondary !py-1 !px-3 text-xs">
        リンクを挿入
      </button>
      <button type="button" onClick={insertButton} className="btn-secondary !py-1 !px-3 text-xs">
        ボタンを挿入
      </button>
    </div>
  );
}
