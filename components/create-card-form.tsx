"use client";

import { useActionState } from "react";
import { createCard } from "@/app/actions/cards";

export function CreateCardForm() {
  const [state, action, pending] = useActionState(createCard, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            name="title"
            required
            maxLength={80}
            placeholder="Work"
            className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 dark:border-white/[.145]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Destination
          <input
            name="destination"
            type="url"
            required
            inputMode="url"
            placeholder="https://"
            className="h-10 rounded-lg border border-black/[.08] bg-transparent px-3 dark:border-white/[.145]"
          />
        </label>
      </div>
      {state && "error" in state ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "Adding…" : "Add card"}
      </button>
    </form>
  );
}
