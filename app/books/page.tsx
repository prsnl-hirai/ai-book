import { createClient } from "@supabase/supabase-js";

export default async function BooksPage() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data: books } = await supabase
    .from("books")
    .select("id, title, created_at");

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">📚 登録書籍一覧</h1>

      <a href="/upload" className="px-4 py-2 bg-blue-600 text-white rounded">
        書籍をアップロード
      </a>

      <div className="mt-6 space-y-4">
        {books?.map((b) => (
          <div
            key={b.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{b.title}</p>
              <p className="text-sm text-gray-500">
                登録日: {new Date(b.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href={`/books/${b.id}`}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                詳細
              </a>

              <form action={`/api/books/delete`} method="POST">
                <input type="hidden" name="book_id" value={b.id} />
                <button className="px-3 py-1 bg-red-500 text-white rounded">
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
