"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardBackPath,
  cardPngPath,
  parseStoredDesign,
  pngSize,
  type StoredCardDesign,
} from "@/lib/card-design";
import { createClient } from "@/utils/supabase/server";

export async function saveCardArtwork(input: {
  id: number;
  design: StoredCardDesign | null;
}): Promise<{ error: string } | { ok: true }> {
  const { userId } = await auth();
  if (!userId || !Number.isInteger(input.id) || input.id < 1) {
    return { error: "Sign in to save this card." };
  }
  if (input.design) {
    const parsed = parseStoredDesign(input.design);
    if (!parsed) {
      return { error: "That design could not be saved." };
    }
  }

  const path = cardPngPath(userId, input.id);
  const supabase = createClient();
  const frontProblem = await plateProblem(supabase, path, {
    missing: "Upload the card image, then save.",
    wrongSize: `The card image has to be ${CARD_WIDTH} × ${CARD_HEIGHT}.`,
  });
  if (frontProblem) {
    return { error: frontProblem };
  }
  if (input.design?.back) {
    const backProblem = await plateProblem(
      supabase,
      cardBackPath(userId, input.id),
      {
        missing: "Upload the back of the card, then save.",
        wrongSize: `The back of the card has to be ${CARD_WIDTH} × ${CARD_HEIGHT}.`,
      },
    );
    if (backProblem) {
      return { error: backProblem };
    }
  }

  const { data, error } = await supabase
    .from("cards")
    .update({
      image_path: path,
      design_json: input.design,
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id");

  if (error || !data?.length) {
    return { error: "Could not save that card." };
  }

  revalidatePath("/");
  revalidatePath(`/cards/${input.id}/design`);
  return { ok: true };
}

/** Null when the stored PNG exists and is exactly one card plate. */
async function plateProblem(
  supabase: ReturnType<typeof createClient>,
  path: string,
  messages: { missing: string; wrongSize: string },
) {
  const file = await supabase.storage.from("cards").download(path);
  if (file.error || !file.data) {
    return messages.missing;
  }
  const size = pngSize(new Uint8Array(await file.data.arrayBuffer()));
  return size?.width === CARD_WIDTH && size.height === CARD_HEIGHT
    ? null
    : messages.wrongSize;
}
