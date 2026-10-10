import { httpsUrl } from "@/lib/cards";
import { createClient } from "@/utils/supabase/server";

const offPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>This card is off</title>
  </head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#0a0a0a;color:#ededed">
    <p>This card is off.</p>
  </body>
</html>`;

export async function GET(
  _request: Request,
  context: RouteContext<"/t/[publicId]">,
) {
  const { publicId } = await context.params;
  const headers = { "Cache-Control": "no-store" };

  if (!/^[0-9a-f]{24}$/.test(publicId)) {
    return new Response(offPage, {
      status: 404,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("resolve_card_destination", {
    card_public_id: publicId,
  });
  const destination = typeof data === "string" ? httpsUrl(data) : null;

  if (error || !destination) {
    return new Response(offPage, {
      status: 404,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: { ...headers, Location: destination },
  });
}
