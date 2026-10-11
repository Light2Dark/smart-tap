"use client";

import { useEffect } from "react";

/** Asks the browser to confirm before a reload or tab close drops unsaved edits. */
export function useUnsavedWarning(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
}
