"use client";

import { useActionState } from "react";
import { restoreCard } from "@/app/actions/cards";
import { Spinner } from "@/components/ui/spinner";
import type { CardRecord } from "@/lib/cards";

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
          aria-busy={pending}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/[.08] px-3 text-sm font-medium disabled:opacity-60 dark:border-white/[.145]"
        >
          {pending ? <Spinner /> : null}
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
