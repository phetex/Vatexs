/**
 * supabase-js only parses the JSON body of a functions.invoke() call when the
 * Edge Function returns 2xx. For any non-2xx response `data` is null and
 * `error` is a generic FunctionsHttpError ("Edge Function returned a non-2xx
 * status code") — the real `{ error: "..." }` body our functions return has
 * to be read off `error.context`, a Response object, instead.
 */
export async function functionErrorMessage(error: unknown, data: { error?: string } | null, fallback: string): Promise<string> {
  if (data?.error) return data.error;
  const context = (error as { context?: Response } | null)?.context;
  if (context?.json) {
    try {
      const body = await context.json();
      if (body?.error) return body.error;
    } catch {
      // response body wasn't JSON — fall through to the generic message
    }
  }
  return (error as { message?: string } | null)?.message ?? fallback;
}
