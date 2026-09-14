import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function BooksPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // 書籍一覧取得
  const { data: books } = await supabase
    .from("books")
    .select("id, title, created_at");

  // チャンク数をまとめて取得
  const { data: chunks } = await supabase.from("documents").select("book_id");

  // book_id ごとにチャンク数を集計
  const chunkCountMap: Record<string, number> = {};
  chunks?.forEach((c) => {
    chunkCountMap[c.book_id] = (chunkCountMap[c.book_id] || 0) + 1;
  });

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-2xl font-bold">📚 書籍一覧</h1>

      <Link
        href="/upload"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        書籍をアップロード
      </Link>

      <div className="space-y-4 mt-6">
        {books?.map((book) => (
          <div
            key={book.id}
            className="border p-4 rounded flex justify-between items-center bg-gray-50"
          >
            <div>
              <p className="font-semibold text-lg">{book.title}</p>
              <p className="text-sm text-gray-600">
                登録日：{new Date(book.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                チャンク数：{chunkCountMap[book.id] ?? 0}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/books/${book.id}`}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                詳細
              </Link>

              <form action="/api/books/delete" method="POST">
                <input type="hidden" name="book_id" value={book.id} />
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  削除
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
