// src/services/ApiService/utils/httpErrors.ts
import { Context } from "hono"
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status"

// Plantilles d’errors més habituals
const httpErrorTemplates: Record<number, { title: string; oAuthCode?: string }> = {
  400: { title: "Bad Request" },
  401: { title: "Unauthorized", oAuthCode: "invalid_token" },
  403: { title: "Forbidden", oAuthCode: "insufficient_scope" },
  404: { title: "Not Found" },
  409: { title: "Conflict" },
  500: { title: "Internal Server Error" },
}

// Helper genèric per retornar errors consistents
export function makeError(
  c: Context,
  status: ContentfulStatusCode,
  errorCode: string,   // codi curt intern (p. ex. ACCESS_TOKEN_EXPIRED)
  message?: string,    // missatge curt (si no es passa → title per defecte)
  detail?: string      // més detall (opcional)
) {
  const tpl = httpErrorTemplates[status] || { title: "Error" }
  const finalMessage = message || tpl.title

  // Afegir header OAuth quan calgui (RFC 6750)
  if (tpl.oAuthCode) {
    c.header(
      "WWW-Authenticate",
      `Bearer error="${tpl.oAuthCode}", error_description="${finalMessage}"`
    )
  }

  // Cos JSON basat en RFC 7807 + extensions
  return c.json(
    {
      type: `https://example.com/probs/${status}/${errorCode.toLowerCase()}`,
      title: tpl.title,
      status,
      detail: detail || finalMessage,
      error: errorCode,
      message: finalMessage,
    },
    status
  )
}
