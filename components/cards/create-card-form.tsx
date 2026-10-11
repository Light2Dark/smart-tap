"use client";

import { useActionState, useEffect, useState } from "react";
import { createCard } from "@/app/actions/cards";
import { fieldClass, fieldState } from "@/components/ui/field";
import { FormNotice } from "@/components/ui/form-notice";
import { Spinner } from "@/components/ui/spinner";
import { useUnsavedWarning } from "@/components/ui/use-unsaved-warning";
import { DESTINATION_ERROR, httpsUrl, titleProblem } from "@/lib/cards";

export function CreateCardForm() {
  const [state, action, pending] = useActionState(createCard, null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const draftKey = `${title}\n${destination}`;
  const dirty = title.length > 0 || destination.length > 0;
  const titleError = title.length > 0 ? titleProblem(title) : null;
  const destinationValid = httpsUrl(destination.trim()) != null;
  const destinationError =
    destination.length > 0 && !destinationValid ? DESTINATION_ERROR : null;
  const canSave =
    title.length > 0 && titleError == null && destinationValid && !pending;
  const serverError =
    !pending && submitted === draftKey && state && "error" in state
      ? state.error
      : null;
  useUnsavedWarning(dirty);

  useEffect(() => {
    if (state && "ok" in state) {
      setTitle("");
      setDestination("");
    }
  }, [state]);

  return (
    <form
      action={action}
      aria-busy={pending}
      onSubmit={() => setSubmitted(draftKey)}
      className="flex flex-col gap-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            name="title"
            required
            maxLength={80}
            value={title}
            placeholder="Work"
            disabled={pending}
            aria-invalid={titleError ? true : undefined}
            onChange={(event) => setTitle(event.target.value)}
            className={`h-10 ${fieldClass(fieldState(title.length > 0, titleError))}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Destination
          <input
            name="destination"
            type="url"
            required
            inputMode="url"
            autoComplete="url"
            value={destination}
            placeholder="https://"
            disabled={pending}
            aria-invalid={destinationError ? true : undefined}
            onChange={(event) => setDestination(event.target.value)}
            className={`h-10 ${fieldClass(
              fieldState(destination.length > 0, destinationError),
            )}`}
          />
        </label>
      </div>
      <FormNotice
        dirty={dirty}
        error={serverError ?? titleError ?? destinationError}
        className="text-sm"
      />
      <button
        type="submit"
        disabled={!canSave}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Adding…" : "Add card"}
      </button>
    </form>
  );
}
