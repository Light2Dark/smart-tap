import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type CardRow,
  type CardsDb,
  createCardResponse,
  listCardsResponse,
  setDeletedResponse,
  updateDestinationResponse,
} from "./card-api.ts";

test("create, list, edit, trash, and restore stay on the owner's cards", async () => {
  const db = memoryDb();

  const created = await createCardResponse("user-a", db, {
    title: "GitHub",
    destinationUrl: "https://github.com/Light2Dark",
  });
  assert.equal(created.status, 200);

  const rejected = await createCardResponse(null, db, {
    title: "GitHub",
    destinationUrl: "https://github.com/Light2Dark",
  });
  assert.equal(rejected.status, 401);

  const active = await readCards(await listCardsResponse("user-a", db, false));
  assert.deepEqual(
    active.map((card) => card.title),
    ["GitHub"],
  );

  const id = String(active[0]?.id);
  const edited = await updateDestinationResponse("user-a", db, id, {
    destinationUrl: "https://github.com/Light2Dark/smart-tap",
  });
  assert.equal(edited.status, 200);

  const trashed = await setDeletedResponse(
    "user-a",
    db,
    id,
    "2026-10-11T00:00:00.000Z",
    "Could not delete that card.",
  );
  assert.equal(trashed.status, 200);
  assert.deepEqual(
    await readCards(await listCardsResponse("user-a", db, false)),
    [],
  );

  const trash = await readCards(await listCardsResponse("user-a", db, true));
  assert.equal(trash.length, 1);

  const otherUser = await setDeletedResponse(
    "user-b",
    db,
    id,
    null,
    "Could not restore that card.",
  );
  assert.equal(otherUser.status, 404);

  const restored = await setDeletedResponse(
    "user-a",
    db,
    id,
    null,
    "Could not restore that card.",
  );
  assert.equal(restored.status, 200);
  const back = await readCards(await listCardsResponse("user-a", db, false));
  assert.equal(
    back[0]?.destinationUrl,
    "https://github.com/Light2Dark/smart-tap",
  );
});

function memoryDb(): CardsDb {
  const rows: CardRow[] = [];
  let nextId = 1;
  return {
    async list(userId, trashed) {
      return rows.filter(
        (row) =>
          row.id > 0 &&
          owner(row, userId) &&
          (trashed ? row.deleted_at !== null : row.deleted_at === null),
      );
    },
    async insert(_userId, title, destinationUrl) {
      rows.unshift({
        id: nextId,
        title,
        destination_url: destinationUrl,
        public_id: nextId.toString(16).padStart(24, "0"),
        deleted_at: null,
        updated_at: new Date().toISOString(),
        image_path: null,
        image_url: null,
        back_image_url: null,
      });
      nextId += 1;
    },
    async updateDestination(userId, id, destinationUrl) {
      const row = rows.find(
        (item) =>
          item.id === id && owner(item, userId) && item.deleted_at === null,
      );
      if (!row) {
        return false;
      }
      row.destination_url = destinationUrl;
      return true;
    },
    async setDeleted(userId, id, deletedAt) {
      const row = rows.find((item) => item.id === id && owner(item, userId));
      if (!row) {
        return false;
      }
      row.deleted_at = deletedAt;
      return true;
    },
  };

  function owner(row: CardRow, userId: string) {
    return rows.includes(row) && userId === "user-a";
  }
}

async function readCards(response: Response) {
  const body = (await response.json()) as {
    cards: { id: number; title: string; destinationUrl: string }[];
  };
  return body.cards;
}
