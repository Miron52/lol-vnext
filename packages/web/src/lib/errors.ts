/**
 * Safely extracts an error message from an unknown caught value.
 * Replaces all `catch (err: any) { err.message }` patterns.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}
