import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { CardEditor } from "@/components/cards/card-editor";
import { CreateCardForm } from "@/components/cards/create-card-form";
import { TrashedCard } from "@/components/cards/trashed-card";
import { toCardRecord } from "@/lib/card-api";
import { supabaseCardsDb } from "@/lib/card-db";

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

  const db = supabaseCardsDb();
  const [active, trashed] = (
    await Promise.all([db.list(userId, false), db.list(userId, true)])
  ).map((rows) => rows.map(toCardRecord));
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">NFC cards</h1>
        <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
          Another phone taps this card to open your link.
        </p>
      </div>
      <CreateCardForm key={active.length} />
      {active.length === 0 ? (
        <p className="text-sm text-zinc-500">No cards yet.</p>
      ) : (
        <div className="grid gap-4">
          {active.map((card) => (
            <CardEditor key={card.id} card={card} />
          ))}
        </div>
      )}
      {trashed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Deleted cards</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Deleted cards stop opening their link until you restore them.
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
