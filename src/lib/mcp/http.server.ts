import { MCP_TOOLS, resolveApiKey, executeTool } from "./registry.server";

/* ------------------------------------------------------------------ */
/*  POST /api/mcp — Model Context Protocol (streamable HTTP, JSON      */
/*  responses). Auth: Authorization: Bearer sfk_… (Agent Access page). */
/*  Supports: initialize, notifications/initialized, tools/list,       */
/*  tools/call, ping.                                                  */
/* ------------------------------------------------------------------ */

type RpcRequest = { jsonrpc: "2.0"; id?: number | string | null; method: string; params?: Record<string, unknown> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const rpcError = (id: number | string | null, code: number, message: string) =>
  json({ jsonrpc: "2.0", id, error: { code, message } });

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === "GET") {
    // Discovery/health for browsers and agents probing the endpoint
    return json({
      name: "signatureflow-mcp",
      version: "1.0.0",
      transport: "streamable-http",
      auth: "Authorization: Bearer sfk_<api-key> — create keys in Agent Access.",
      tools: MCP_TOOLS.map((t) => t.name),
    });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const actor = bearer ? await resolveApiKey(bearer) : null;
  if (!actor) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized: missing or invalid API key. Create one in Agent Access." } }, 401);
  }

  let msg: RpcRequest;
  try {
    msg = (await request.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error: body must be JSON-RPC 2.0");
  }
  const id = msg.id ?? null;

  switch (msg.method) {
    case "initialize":
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: (msg.params?.protocolVersion as string) ?? "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "signatureflow-mcp", version: "1.0.0" },
        },
      });

    case "notifications/initialized":
      return new Response(null, { status: 202 });

    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });

    case "tools/list":
      return json({ jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } });

    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
      const res = await executeTool(actor, name, args);
      if (res.ok) {
        const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
        return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError: false } });
      }
      // Tool-level failures are returned as tool results per MCP spec
      return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: res.error ?? "Tool failed" }], isError: true } });
    }

    default:
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}
