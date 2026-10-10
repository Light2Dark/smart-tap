"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  type CardActionState,
  httpsUrl,
  parseCardFields,
  parseCardId,
} from "@/lib/cards";
import { createClient } from "@/utils/supabase/server";

async function ownerId() {
  const { userId } = await auth();
  return userId;
}

export async function createCard(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const userId = await ownerId();
  if (!userId) {
    return { error: "Sign in to add a card." };
  }

  const parsed = parseCardFields(formData);
  if ("error" in parsed) {
    return parsed;
  }

  const supabase = createClient();
  const { error } = await supabase.from("cards").insert({
    user_id: userId,
    title: parsed.title,
    destination_url: parsed.destinationUrl,
  });

  if (error) {
    return { error: "Could not add that card." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateDestination(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const userId = await ownerId();
  const id = parseCardId(formData);
  const destinationUrl = httpsUrl(
    String(formData.get("destination") ?? "").trim(),
  );

  if (!userId) {
    return { error: "Sign in to edit a card." };
  }
  if (id === null || !destinationUrl) {
    return { error: "The destination has to be an https link." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .update({ destination_url: destinationUrl })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id");

  if (error || !data?.length) {
    return { error: "Could not update that destination." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function softDeleteCard(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  return setDeletedAt(
    formData,
    new Date().toISOString(),
    "Could not move that card to trash.",
  );
}

export async function restoreCard(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  return setDeletedAt(formData, null, "Could not restore that card.");
}

async function setDeletedAt(
  formData: FormData,
  deletedAt: string | null,
  failure: string,
): Promise<CardActionState> {
  const userId = await ownerId();
  const id = parseCardId(formData);
  if (!userId || id === null) {
    return { error: failure };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error || !data?.length) {
    return { error: failure };
  }

  revalidatePath("/");
  return { ok: true };
}
