import { createClient } from "@/utils/supabase/server";
import type { CardRow, CardsDb } from "./card-api.ts";
import { cardBackPath, designHasBack } from "./card-design.ts";
import { signCardImage } from "./card-images.ts";

const LIST_COLUMNS =
  "id, title, destination_url, public_id, deleted_at, updated_at, image_path, design_json";

type ListedRow = Omit<CardRow, "image_url" | "back_image_url"> & {
  design_json: unknown;
};

export function supabaseCardsDb(): CardsDb {
  const supabase = createClient();

  async function withImages(
    userId: string,
    { design_json, ...row }: ListedRow,
  ): Promise<CardRow> {
    const [imageUrl, backImageUrl] = await Promise.all([
      signCardImage(supabase, row.image_path),
      designHasBack(design_json)
        ? signCardImage(supabase, cardBackPath(userId, row.id))
        : null,
    ]);
    return { ...row, image_url: imageUrl, back_image_url: backImageUrl };
  }

  async function changedRows(
    query: PromiseLike<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>,
  ) {
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return Boolean(data?.length);
  }

  return {
    async list(userId, trashed) {
      const base = supabase
        .from("cards")
        .select(LIST_COLUMNS)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      const { data, error } = await (trashed
        ? base.not("deleted_at", "is", null)
        : base.is("deleted_at", null));
      if (error) {
        throw new Error(error.message);
      }
      return Promise.all(
        ((data ?? []) as ListedRow[]).map((row) => withImages(userId, row)),
      );
    },
    async insert(userId, title, destinationUrl) {
      const { error } = await supabase.from("cards").insert({
        user_id: userId,
        title,
        destination_url: destinationUrl,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    updateDestination(userId, id, destinationUrl) {
      return changedRows(
        supabase
          .from("cards")
          .update({ destination_url: destinationUrl })
          .eq("id", id)
          .eq("user_id", userId)
          .is("deleted_at", null)
          .select("id"),
      );
    },
    setDeleted(userId, id, deletedAt) {
      return changedRows(
        supabase
          .from("cards")
          .update({ deleted_at: deletedAt })
          .eq("id", id)
          .eq("user_id", userId)
          .select("id"),
      );
    },
  };
}
