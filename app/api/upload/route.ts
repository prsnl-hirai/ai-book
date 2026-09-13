export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "ファイルがありません" },
        { status: 400 },
      );
    }

    // TXT を読み込む
    const text = await file.text();

    // チャンク化（段落ごと）
    function splitIntoChunks(text: string, size = 1000) {
      const chunks = [];
      for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
      }
      return chunks;
    }

    const chunks = splitIntoChunks(text, 1000);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // 1チャンクずつ埋め込み生成 → Supabase に保存
    for (const chunk of chunks) {
      const embedding = await client.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk,
      });

      const vector = embedding.data[0].embedding;

      // ベクトルの次元数を確認
      if (vector.length !== 1536) {
        console.error(
          `次元数エラー: ${vector.length}次元ですが、1536次元が必要です`,
        );
        continue; // 次のチャンクへ移行
      }

      const { error } = await supabase.from("documents").insert({
        content: chunk,
        embedding: vector,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
    }

    return NextResponse.json({
      message: "Supabase に埋め込み保存が完了しました！",
    });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json(
      { message: "サーバーエラー", error: String(e) },
      { status: 500 },
    );
  }
}
