/**
 * Minimal shape of a fetch Response this module needs. Kept structural so it can
 * be unit-tested with a plain object and used with a real Response.
 */
export interface ReadableResponse {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  json: () => Promise<unknown>
  text: () => Promise<string>
}

/**
 * Safely derive a human-readable error message from a failed API response.
 *
 * Callers must NEVER blindly `await response.json()` on an error: the platform
 * (e.g. Vercel serverless) rejects oversized request bodies with a plain-text
 * `413 Request Entity Too Large` BEFORE the route runs, so `.json()` throws a raw
 * `Unexpected token 'R', "Request En"…` SyntaxError. This reads the content-type
 * first and handles JSON, plain-text 413, and empty bodies gracefully.
 */
export async function extractApiErrorMessage(
  response: ReadableResponse,
  fallback = 'Request failed'
): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { error?: unknown; details?: unknown } | null
      const message = [data?.details, data?.error].find(
        (m): m is string => typeof m === 'string' && m.trim().length > 0
      )
      return message || fallback
    }

    const text = await response.text()
    if (response.status === 413 || /Request En|Entity Too Large/i.test(text)) {
      return 'One or more files are too large to upload. Please use smaller or lower-resolution images.'
    }
    if (text && text.trim().length > 0) {
      return `Server error (${response.status}): ${text.substring(0, 120)}`
    }
    return `Server error (${response.status}). Please try again.`
  } catch {
    return `Server error (${response.status}). Please try again.`
  }
}
