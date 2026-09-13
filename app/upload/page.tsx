"use client";

import { useState, useRef } from "react";

export default function UploadCard() {
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("ファイルが選択されていません");
      return;
    }

    setStatus("アップロード中…");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    setStatus(json.message || "完了");
  };

  return (
    <div className="mx-auto mt-10 w-[600px]">
      <div className="border rounded-xl shadow-md p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">📚 書籍アップロード</h2>

        {/* 隠し input */}
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* ファイル選択ボタン */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ファイルを選択
        </button>

        {/* 選択されたファイル名 */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-gray-700">
          {fileName ? (
            <span className="font-medium">選択中: {fileName}</span>
          ) : (
            <span className="text-gray-500">
              まだファイルが選択されていません
            </span>
          )}
        </div>

        {/* アップロードボタン */}
        <button
          onClick={handleUpload}
          className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          アップロード
        </button>

        {/* ステータス表示 */}
        <p className="mt-4 text-gray-700">{status}</p>
      </div>
    </div>
  );
}
