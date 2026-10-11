"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { CardsDb } from "@/lib/card-api";
import { supabaseCardsDb } from "@/lib/card-db";
import {
  type CardActionState,
  DESTINATION_ERROR,
  parseCardFields,
  parseCardId,
  parseDestination,
} from "@/lib/cards";

export async function createCard(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Sign in to add a card." };
  }
  const parsed = parseCardFields(formData);
  if ("error" in parsed) {
    return parsed;
  }
  return write("Could not add that card.", async (db) => {
    await db.insert(userId, parsed.title, parsed.destinationUrl);
    return true;
  });
}

export async function updateDestination(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Sign in to edit a card." };
  }
  const id = parseCardId(formData);
  const parsed = parseDestination(String(formData.get("destination") ?? ""));
  if (id === null || "error" in parsed) {
    return { error: DESTINATION_ERROR };
  }
  return write("Could not update that destination.", (db) =>
    db.updateDestination(userId, id, parsed.destinationUrl),
  );
}

export async function softDeleteCard(
  _prev: CardActionState,
  formData: FormData,
): Promise<CardActionState> {
  return setDeletedAt(
    formData,
    new Date().toISOString(),
    "Could not delete that card.",
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
  const { userId } = await auth();
  const id = parseCardId(formData);
  if (!userId || id === null) {
    return { error: failure };
  }
  return write(failure, (db) => db.setDeleted(userId, id, deletedAt));
}

async function write(
  failure: string,
  change: (db: CardsDb) => Promise<boolean>,
): Promise<CardActionState> {
  const changed = await change(supabaseCardsDb()).catch(() => false);
  if (!changed) {
    return { error: failure };
  }
  revalidatePath("/");
  return { ok: true };
}
