"use client";

import { useState } from "react";
import { fieldClass, fieldState } from "@/components/ui/field";
import { FormNotice } from "@/components/ui/form-notice";
import { Spinner } from "@/components/ui/spinner";
import { useUnsavedWarning } from "@/components/ui/use-unsaved-warning";
import {
  type CardRecord,
  DESTINATION_ERROR,
  destinationUnchanged,
  httpsUrl,
} from "@/lib/cards";

export function DestinationForm({
  card,
  action,
  saving,
  locked,
  serverError,
}: {
  card: CardRecord;
  action: (payload: FormData) => void;
  saving: boolean;
  locked: boolean;
  serverError: string | null;
}) {
  const [destination, setDestination] = useState(card.destinationUrl);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const dirty = !destinationUnchanged(destination, card.destinationUrl);
  const problem =
    dirty && httpsUrl(destination.trim()) == null ? DESTINATION_ERROR : null;
  const canSave = dirty && problem == null && !saving && !locked;
  const visibleError =
    !saving && submitted === destination && serverError ? serverError : problem;
  useUnsavedWarning(dirty);

  return (
    <form
      action={action}
      aria-busy={saving}
      onSubmit={() => setSubmitted(destination)}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={card.id} />
      <label
        htmlFor={`destination-${card.id}`}
        className="text-xs font-medium text-zinc-500"
      >
        Destination
      </label>
      <div className="flex gap-2">
        <input
          id={`destination-${card.id}`}
          name="destination"
          type="url"
          required
          inputMode="url"
          autoComplete="url"
          value={destination}
          disabled={saving || locked}
          aria-invalid={problem ? true : undefined}
          onChange={(event) => setDestination(event.target.value)}
          className={`h-9 min-w-0 flex-1 text-sm ${fieldClass(fieldState(dirty, problem))}`}
        />
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity disabled:opacity-30"
        >
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <FormNotice dirty={dirty} error={visibleError} />
    </form>
  );
}
