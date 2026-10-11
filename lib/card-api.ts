import {
  type CardRecord,
  DESTINATION_ERROR,
  parseCreateBody,
  parseDestinationBody,
  parseId,
} from "./cards.ts";

export type CardRow = {
  id: number;
  title: string;
  destination_url: string;
  public_id: string;
  deleted_at: string | null;
  updated_at: string;
  image_path: string | null;
  image_url: string | null;
  back_image_url: string | null;
};

export type CardsDb = {
  list(userId: string, trashed: boolean): Promise<CardRow[]>;
  insert(userId: string, title: string, destinationUrl: string): Promise<void>;
  updateDestination(
    userId: string,
    id: number,
    destinationUrl: string,
  ): Promise<boolean>;
  setDeleted(
    userId: string,
    id: number,
    deletedAt: string | null,
  ): Promise<boolean>;
};

export function toCardRecord(row: CardRow): CardRecord {
  return {
    id: row.id,
    title: row.title,
    destinationUrl: row.destination_url,
    publicId: row.public_id,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
    imageUrl: row.image_url,
    backImageUrl: row.back_image_url,
  };
}

export function toCardJson(card: CardRow) {
  return {
    id: card.id,
    title: card.title,
    destinationUrl: card.destination_url,
    publicId: card.public_id,
    imageUrl: card.image_url,
    backImageUrl: card.back_image_url,
  };
}

export async function listCardsResponse(
  userId: string | null,
  db: CardsDb,
  trashed: boolean,
) {
  if (!userId) {
    return unauthorized();
  }
  try {
    const cards = await db.list(userId, trashed);
    return Response.json({ cards: cards.map(toCardJson) });
  } catch {
    return failure("Could not load cards.", 500);
  }
}

export async function createCardResponse(
  userId: string | null,
  db: CardsDb,
  body: unknown,
) {
  if (!userId) {
    return unauthorized();
  }
  const parsed = parseCreateBody(body);
  if ("error" in parsed) {
    return failure(parsed.error, 400);
  }
  try {
    await db.insert(userId, parsed.title, parsed.destinationUrl);
    return Response.json({ ok: true });
  } catch {
    return failure("Could not add that card.", 500);
  }
}

export async function updateDestinationResponse(
  userId: string | null,
  db: CardsDb,
  idValue: string,
  body: unknown,
) {
  if (!userId) {
    return unauthorized();
  }
  const id = parseId(idValue);
  const parsed = parseDestinationBody(body);
  if (id === null || "error" in parsed) {
    return failure(DESTINATION_ERROR, 400);
  }
  try {
    const updated = await db.updateDestination(
      userId,
      id,
      parsed.destinationUrl,
    );
    return updated
      ? Response.json({ ok: true })
      : failure("Could not update that destination.", 404);
  } catch {
    return failure("Could not update that destination.", 500);
  }
}

export async function setDeletedResponse(
  userId: string | null,
  db: CardsDb,
  idValue: string,
  deletedAt: string | null,
  message: string,
) {
  if (!userId) {
    return unauthorized();
  }
  const id = parseId(idValue);
  if (id === null) {
    return failure(message, 400);
  }
  try {
    const updated = await db.setDeleted(userId, id, deletedAt);
    return updated ? Response.json({ ok: true }) : failure(message, 404);
  } catch {
    return failure(message, 500);
  }
}

function unauthorized() {
  return failure("Sign in required.", 401);
}

function failure(error: string, status: number) {
  return Response.json({ error }, { status });
}
