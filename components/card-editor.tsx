"use client";

import { useActionState } from "react";
import {
  restoreCard,
  softDeleteCard,
  updateDestination,
} from "@/app/actions/cards";
import type { CardRecord } from "@/lib/cards";

export function CardEditor({
  card,
  tapUrl,
}: {
  card: CardRecord;
  tapUrl: string;
}) {
  const [destinationState, saveDestination, saving] = useActionState(
    updateDestination,
    null,
  );
  const [deleteState, remove, removing] = useActionState(softDeleteCard, null);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex aspect-[1.586/1] flex-col justify-end rounded-xl bg-zinc-100 px-5 py-4 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold tracking-tight">{card.title}</h2>
      </div>
      <p className="break-all text-sm text-zinc-600 dark:text-zinc-400">
        {card.destinationUrl}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-black/[.06] px-2 py-1 text-xs dark:bg-white/[.08]">
          {tapUrl}
        </code>
        <CopyLink url={tapUrl} />
      </div>
      <form
        action={saveDestination}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input type="hidden" name="id" value={card.id} />
        <input
          name="destination"
          type="url"
          required
          defaultValue={card.destinationUrl}
          key={card.updatedAt}
          aria-label={`Destination for ${card.title}`}
          className="h-10 min-w-0 flex-1 rounded-lg border border-black/[.08] bg-transparent px-3 text-sm dark:border-white/[.145]"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-60 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          {saving ? "Saving…" : "Save link"}
        </button>
      </form>
      {destinationState && "error" in destinationState ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {destinationState.error}
        </p>
      ) : null}
      <form action={remove}>
        <input type="hidden" name="id" value={card.id} />
        <button
          type="submit"
          disabled={removing}
          className="text-sm text-zinc-600 underline-offset-2 hover:underline disabled:opacity-60 dark:text-zinc-400"
        >
          {removing ? "Moving…" : "Move to trash"}
        </button>
        {deleteState && "error" in deleteState ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {deleteState.error}
          </p>
        ) : null}
      </form>
    </article>
  );
}

export function TrashedCard({ card }: { card: CardRecord }) {
  const [state, restore, pending] = useActionState(restoreCard, null);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
      <div className="min-w-0">
        <p className="font-medium">{card.title}</p>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {card.destinationUrl}
        </p>
      </div>
      <form action={restore}>
        <input type="hidden" name="id" value={card.id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-full border border-black/[.08] px-3 text-sm font-medium disabled:opacity-60 dark:border-white/[.145]"
        >
          {pending ? "Restoring…" : "Restore"}
        </button>
      </form>
      {state && "error" in state ? (
        <p className="w-full text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}

function CopyLink({ url }: { url: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center justify-center rounded-full border border-black/[.08] px-3 text-xs font-medium dark:border-white/[.145]"
      onClick={() => {
        void navigator.clipboard.writeText(url);
      }}
    >
      Copy
    </button>
  );
}
