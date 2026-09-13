export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { message: "質問がありません" },
        { status: 400 },
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // 質問を埋め込み化
    const embedding = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const queryVector = embedding.data[0].embedding;

    // Supabase 類似検索
    const { data: matches, error } = await supabase.rpc("match_documents", {
      query_embedding: queryVector,
      match_count: 5,
    });

    if (error) {
      console.error("Supabase match error:", error);
      throw error;
    }

    const context = matches.map((m: any) => m.content).join("\n\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
あなたは優しく寄り添う相談AIです。
…（省略）
        `,
        },
        {
          role: "user",
          content: `
参考情報:
${context}

質問:
${question}
        `,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json(
      { message: "サーバーエラー", error: String(e) },
      { status: 500 },
    );
  }
}
