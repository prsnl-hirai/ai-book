import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const form = await req.formData();
  const file = form.get("file") as File;
  const title = form.get("title") as string;

  if (!file || !title) {
    return NextResponse.json(
      { message: "タイトルとTXTファイルが必要です" },
      { status: 400 },
    );
  }

  // TXT読み込み
  const text = await file.text();

  // チャンク化（空行で区切る）
  const chunks = text
    .split(/\n\s*\n+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  // 書籍レコード作成
  const { data: book } = await supabase
    .from("books")
    .insert({ title })
    .select()
    .single();

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // チャンクごとに埋め込み生成
  for (const chunk of chunks) {
    const embedding = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });

    await supabase.from("documents").insert({
      book_id: book.id,
      content: chunk,
      embedding: embedding.data[0].embedding,
    });
  }

  return NextResponse.json({
    message: "アップロード完了",
    count: chunks.length,
  });
}
