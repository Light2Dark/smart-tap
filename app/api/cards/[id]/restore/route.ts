import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { setDeletedResponse } from "@/lib/card-api";
import { supabaseCardsDb } from "@/lib/card-db";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/cards/[id]/restore">,
) {
  const { userId } = await auth();
  const { id } = await context.params;
  const response = await setDeletedResponse(
    userId,
    supabaseCardsDb(),
    id,
    null,
    "Could not restore that card.",
  );
  if (response.ok) {
    revalidatePath("/");
  }
  return response;
}
