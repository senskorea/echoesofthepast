// Retired: all paid work uses the authenticated, quota-controlled ai-gateway.
Deno.serve(() => new Response(JSON.stringify({ code: "unavailable" }), {
  status: 410,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
}));
