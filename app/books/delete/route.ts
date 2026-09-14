import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const form = await req.formData();
  const book_id = form.get("book_id") as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await supabase.from("documents").delete().eq("book_id", book_id);
  await supabase.from("books").delete().eq("id", book_id);

  return NextResponse.redirect("/books");
}
