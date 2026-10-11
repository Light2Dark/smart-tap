import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCardResponse, listCardsResponse } from "@/lib/card-api";
import { supabaseCardsDb } from "@/lib/card-db";

export async function GET(request: Request) {
  const { userId } = await auth();
  const trashed = new URL(request.url).searchParams.get("trashed") === "1";
  return listCardsResponse(userId, supabaseCardsDb(), trashed);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const body = await request.json().catch(() => null);
  const response = await createCardResponse(userId, supabaseCardsDb(), body);
  if (response.ok) {
    revalidatePath("/");
  }
  return response;
}
