/** One line under a form: the error when there is one, otherwise the unsaved hint. */
export function FormNotice({
  dirty,
  error,
  className = "text-xs",
}: {
  dirty: boolean;
  error: string | null;
  className?: string;
}) {
  if (error) {
    return (
      <p className={`${className} text-red-600 dark:text-red-400`}>{error}</p>
    );
  }
  if (dirty) {
    return (
      <p
        className={`${className} font-medium text-amber-700 dark:text-amber-400`}
      >
        Unsaved changes
      </p>
    );
  }
  return null;
}
