"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function BookDetailPage({ params }: PageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // 書籍情報
  const { data: book } = await supabase
    .from("books")
    .select("id, title, created_at")
    .eq("id", params.id)
    .single();

  // チャンク一覧
  const { data: chunks } = await supabase
    .from("documents")
    .select("id, content")
    .eq("book_id", params.id);

  return <DetailClient book={book} chunks={chunks ?? []} />;
}

function DetailClient({ book, chunks }: any) {
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState(book.title);
  const filtered = chunks.filter((c: any) =>
    c.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-2xl font-bold">📖 書籍詳細</h1>

      {/* 書籍情報カード */}
      <div className="border p-4 rounded bg-gray-50 shadow-sm space-y-3">
        <div>
          <label className="font-semibold">タイトル編集</label>
          <input
            className="border p-2 w-full rounded mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <p className="text-sm text-gray-600">
          登録日：{new Date(book.created_at).toLocaleString()}
        </p>

        <div className="flex gap-3">
          <Link
            href="/books"
            className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            ← 書籍一覧へ戻る
          </Link>

          <form action="/api/books/reembed" method="POST">
            <input type="hidden" name="book_id" value={book.id} />
            <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              再埋め込み
            </button>
          </form>

          <form action="/api/books/delete" method="POST">
            <input type="hidden" name="book_id" value={book.id} />
            <button className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              書籍削除
            </button>
          </form>
        </div>
      </div>

      {/* 文章ブロック検索 */}
      <div>
        <label className="font-semibold">文章ブロック検索</label>
        <input
          className="border p-2 w-full rounded mt-1"
          placeholder="キーワードで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 文章ブロック一覧 */}
      <h2 className="text-xl font-bold">📚 文章ブロック一覧</h2>

      <div>
        <label className="font-semibold">文章検索</label>
        <input
          className="border p-2 w-full rounded mt-1"
          placeholder="キーワードで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((block: any) => (
          <details key={block.id} className="border p-4 rounded bg-white">
            <summary className="cursor-pointer font-semibold">
              ブロックID: {block.id}
            </summary>
            <p className="whitespace-pre-wrap text-sm mt-2">{block.content}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
