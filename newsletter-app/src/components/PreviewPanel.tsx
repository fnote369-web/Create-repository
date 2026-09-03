"use client";

import { useState } from "react";

export default function PreviewPanel({
  bodyTextareaId,
  subjectInputId,
}: {
  bodyTextareaId: string;
  subjectInputId: string;
}) {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<"pc" | "mobile">("pc");
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");

  function refresh() {
    const bodyEl = document.getElementById(bodyTextareaId) as HTMLTextAreaElement | null;
    const subjectEl = document.getElementById(subjectInputId) as HTMLInputElement | null;
    setHtml(bodyEl?.value ?? "");
    setSubject(subjectEl?.value ?? "");
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={refresh} className="btn-secondary">
          プレビューを見る
        </button>
        {open && (
          <>
            <button
              type="button"
              onClick={() => setDevice("pc")}
              className={`btn-secondary !py-1 !px-3 text-xs ${device === "pc" ? "bg-brand-50 border-brand-500 text-brand-700" : ""}`}
            >
              PC表示
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`btn-secondary !py-1 !px-3 text-xs ${device === "mobile" ? "bg-brand-50 border-brand-500 text-brand-700" : ""}`}
            >
              スマホ表示
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">件名: {subject || "(未入力)"}</div>
          <div className={device === "pc" ? "w-full" : "w-[375px] mx-auto"}>
            <iframe
              title="preview"
              srcDoc={html}
              className="w-full bg-white border border-gray-300 rounded"
              style={{ height: 500 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
