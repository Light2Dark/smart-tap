"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { softDeleteCard, updateDestination } from "@/app/actions/cards";
import {
  CardBack,
  CardFront,
  type CardSide,
  FaceToggle,
} from "@/components/cards/card-faces";
import { DestinationForm } from "@/components/cards/destination-form";
import { Spinner } from "@/components/ui/spinner";
import type { CardActionState, CardRecord } from "@/lib/cards";

export function CardEditor({ card }: { card: CardRecord }) {
  const [destinationState, saveDestination, saving] = useActionState(
    updateDestination,
    null,
  );
  const [deleteState, remove, removing] = useActionState(softDeleteCard, null);
  const [side, setSide] = useState<CardSide>("front");

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-black/[.08] p-4 sm:p-5 dark:border-white/[.1]">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[2024/1276] overflow-hidden rounded-xl shadow-sm ring-1 ring-black/[.06] dark:ring-white/[.08]">
          {side === "front" ? (
            <CardFront card={card} />
          ) : (
            <CardBack card={card} />
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/cards/${card.id}/design`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[.08] px-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.12] dark:hover:bg-white/[.06]"
          >
            <PencilIcon />
            Design this card
          </Link>
          <FaceToggle side={side} title={card.title} onChange={setSide} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4 border-t border-black/[.06] pt-5 dark:border-white/[.08]">
        <h2 className="min-w-0 truncate text-base font-semibold tracking-tight">
          {card.title}
        </h2>
        <DestinationForm
          key={card.updatedAt}
          card={card}
          action={saveDestination}
          saving={saving}
          locked={removing}
          serverError={errorOf(destinationState)}
        />
        <form action={remove} className="flex flex-col items-end">
          <input type="hidden" name="id" value={card.id} />
          <button
            type="submit"
            disabled={removing || saving}
            aria-busy={removing}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-red-600 disabled:opacity-60 dark:hover:text-red-400"
          >
            {removing ? <Spinner /> : null}
            {removing ? "Deleting…" : "Delete this card"}
          </button>
          {errorOf(deleteState) ? (
            <p className="mt-2 text-right text-sm text-red-600 dark:text-red-400">
              {errorOf(deleteState)}
            </p>
          ) : null}
        </form>
      </div>
    </article>
  );
}

function errorOf(state: CardActionState) {
  return state && "error" in state ? state.error : null;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <path
        d="M10.5 2.5 L13.5 5.5 L6 13 H3 V10 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
