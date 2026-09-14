import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const form = await req.formData();
  const book_id = form.get("book_id") as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // チャンク取得
  const { data: chunks } = await supabase
    .from("documents")
    .select("id, content")
    .eq("book_id", book_id);

  // 再埋め込み
  for (const chunk of chunks!) {
    const embedding = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk.content,
    });

    await supabase
      .from("documents")
      .update({ embedding: embedding.data[0].embedding })
      .eq("id", chunk.id);
  }

  return NextResponse.redirect(`/books/${book_id}`);
}
