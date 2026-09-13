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
      model: "text-embedding-3-large",
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

    // コンテキストを作る
    const context = matches.map((m: any) => m.content).join("\n\n");

    // OpenAI に回答させる
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
あなたは優しく寄り添う相談AIです。

回答は必ず以下の3ステップで行ってください。

1. 共感：まずユーザーの気持ちを受け止める一言を入れる
2. 解釈：参考情報をもとに、ユーザーの状況を丁寧に整理して伝える
   ※「コンテキスト」「参考文献」「データ」などの単語は使わない
   ※自然な文章の流れで、あたかも自分が理解しているかのように説明する
3. 提案：ユーザーが次にどうすればいいか、優しく具体的に提案する

禁止事項：
- 「コンテキスト」「情報源」「データによると」などの機械的な表現
- 決めつけや断定
- 医療・法律の断言
- ユーザーを否定する表現

口調は柔らかい敬語で、安心できる相談相手のように。
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
