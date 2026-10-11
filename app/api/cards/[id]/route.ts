import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { updateDestinationResponse } from "@/lib/card-api";
import { supabaseCardsDb } from "@/lib/card-db";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/cards/[id]">,
) {
  const { userId } = await auth();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const response = await updateDestinationResponse(
    userId,
    supabaseCardsDb(),
    id,
    body,
  );
  if (response.ok) {
    revalidatePath("/");
  }
  return response;
}
