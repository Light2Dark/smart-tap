import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Suspense } from "react";
import { CardEditor, TrashedCard } from "@/components/card-editor";
import { CreateCardForm } from "@/components/create-card-form";
import type { CardRecord } from "@/lib/cards";
import { createClient } from "@/utils/supabase/server";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <Suspense
        fallback={<p className="text-sm text-zinc-500">Loading your cards…</p>}
      >
        <CardHome />
      </Suspense>
    </main>
  );
}

async function CardHome() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Smart Tap</h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A wallet of digital cards. Create one here, then open it on your phone
          so someone can tap it and land on your link.
        </p>
      </div>
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, title, destination_url, public_id, deleted_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Could not load cards.");
  }

  const cards = (data ?? []).map(toCard);
  const active = cards.filter((card) => card.deletedAt === null);
  const trashed = cards.filter((card) => card.deletedAt !== null);
  const origin = await requestOrigin();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Cards</h1>
        <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
          Each card keeps one link. Changing it here changes the next tap.
        </p>
      </div>
      <CreateCardForm key={active.length} />
      {active.length === 0 ? (
        <p className="text-sm text-zinc-500">No cards yet.</p>
      ) : (
        <div className="grid gap-4">
          {active.map((card) => (
            <CardEditor
              key={card.id}
              card={card}
              tapUrl={`${origin}/t/${card.publicId}`}
            />
          ))}
        </div>
      )}
      {trashed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Trash</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Trashed cards stop opening their link until you restore them.
          </p>
          <ul className="flex flex-col gap-2">
            {trashed.map((card) => (
              <TrashedCard key={card.id} card={card} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function toCard(row: {
  id: number;
  title: string;
  destination_url: string;
  public_id: string;
  deleted_at: string | null;
  updated_at: string;
}): CardRecord {
  return {
    id: row.id,
    title: row.title,
    destinationUrl: row.destination_url,
    publicId: row.public_id,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  };
}

async function requestOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}
