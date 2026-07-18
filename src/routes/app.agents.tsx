import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot, Play, KeyRound, Copy, Loader2, ShieldCheck, ScrollText, Gauge, Plug, Ban, CheckCircle2, XCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  getAgentAccessState, createMcpKey, revokeMcpKey, setToolPermission, setQuota, listAuditLogs, runToolAsUser,
} from "@/lib/mcp.functions";

export const Route = createFileRoute("/app/agents")({
  component: Agents,
});

interface KeyRow { id: string; name: string; key_prefix: string; last_used_at: string | null; revoked_at: string | null; created_at: string }
interface AuditRow { id: string; actor: string; tool: string; input_summary: string | null; status: string; result_summary: string | null; duration_ms: number | null; created_at: string; api_key_id: string | null }
interface State {
  role: string;
  tools: { name: string; description: string }[];
  keys: KeyRow[];
  permissions: { role: string; tool: string; allowed: boolean }[];
  quota: { perMinuteLimit: number; dailyLimit: number; usedThisMinute: number; usedToday: number };
  lastAgentCall: { created_at: string; status: string } | null;
}

const ROLES = ["agent", "marketing", "hr", "employee"] as const;
const statusBadge: Record<string, string> = {
  ok: "bg-brand text-brand-foreground",
  denied: "bg-destructive/10 text-destructive",
  rate_limited: "bg-amber-500/15 text-amber-700",
  error: "bg-destructive/10 text-destructive",
};

const EXAMPLE_ARGS: Record<string, string> = {
  list_employees: '{ "q": "", "limit": 10 }',
  list_templates: "{}",
  list_signatures: '{ "limit": 10 }',
  list_campaigns: "{}",
  generate_signature_html: '{ "template_id": "noir-motion", "first_name": "Amina", "last_name": "Mrisho", "job_title": "Head of Partnerships", "company": "Revoltek", "email": "amina@revoltek.co.tz", "accent": "#FF4D00" }',
};

function Agents() {
  const fetchState = useServerFn(getAgentAccessState);
  const runCreate = useServerFn(createMcpKey);
  const runRevoke = useServerFn(revokeMcpKey);
  const runPerm = useServerFn(setToolPermission);
  const runQuota = useServerFn(setQuota);
  const fetchAudit = useServerFn(listAuditLogs);
  const runTool = useServerFn(runToolAsUser);

  const [state, setState] = useState<State | null>(null);
  const isAdmin = state?.role === "owner" || state?.role === "admin";

  const load = useCallback(async () => {
    try { setState((await fetchState()) as State); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
  }, [fetchState]);
  useEffect(() => { void load(); }, [load]);

  /* ---------- console ---------- */
  const [tool, setTool] = useState("list_templates");
  const [argsText, setArgsText] = useState(EXAMPLE_ARGS.list_templates);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ status: string; body: string; html?: string } | null>(null);

  const execute = async () => {
    let args: Record<string, unknown> = {};
    try { args = argsText.trim() ? JSON.parse(argsText) : {}; }
    catch { return toast.error("Arguments must be valid JSON."); }
    setRunning(true);
    setOutput(null);
    try {
      const res = (await runTool({ data: { tool, args } })) as { ok: boolean; status: string; data?: unknown; error?: string };
      const body = res.ok
        ? (typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2))
        : `${res.status.toUpperCase()}: ${res.error}`;
      setOutput({
        status: res.status,
        body,
        html: res.ok && tool === "generate_signature_html" && typeof res.data === "string" ? res.data : undefined,
      });
      void load(); // refresh usage numbers
    } catch (e) {
      setOutput({ status: "error", body: e instanceof Error ? e.message : "Request failed" });
    } finally { setRunning(false); }
  };

  /* ---------- keys ---------- */
  const [keyName, setKeyName] = useState("");
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);

  const createKey = async () => {
    if (!keyName.trim()) return toast.error("Name the key (e.g. “Claude agent”).");
    setKeyBusy(true);
    try {
      const { key } = await runCreate({ data: { name: keyName.trim() } });
      setFreshKey(key);
      setKeyName("");
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setKeyBusy(false); }
  };

  const revoke = async (id: string) => {
    if (!window.confirm("Revoke this key? Agents using it will immediately lose access.")) return;
    try { await runRevoke({ data: { id } }); toast.success("Key revoked"); void load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  /* ---------- permissions ---------- */
  const permMap = useMemo(() => {
    const m = new Map<string, boolean>();
    state?.permissions.forEach((p) => m.set(`${p.role}:${p.tool}`, p.allowed));
    return m;
  }, [state?.permissions]);

  const togglePerm = async (role: string, toolName: string, allowed: boolean) => {
    try {
      await runPerm({ data: { role: role as (typeof ROLES)[number], tool: toolName, allowed } });
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  /* ---------- audit ---------- */
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [auditTool, setAuditTool] = useState("all");
  const [auditStatus, setAuditStatus] = useState("all");
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const rows = await fetchAudit({ data: {
        tool: auditTool === "all" ? undefined : auditTool,
        status: auditStatus === "all" ? undefined : auditStatus,
        limit: 100,
      }});
      setAudit(rows as AuditRow[]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setAuditLoading(false); }
  }, [fetchAudit, auditTool, auditStatus]);
  useEffect(() => { void loadAudit(); }, [loadAudit]);

  /* ---------- quota ---------- */
  const [qMin, setQMin] = useState("");
  const [qDay, setQDay] = useState("");
  useEffect(() => {
    if (state) { setQMin(String(state.quota.perMinuteLimit)); setQDay(String(state.quota.dailyLimit)); }
  }, [state]);
  const saveQuota = async () => {
    try {
      await runQuota({ data: { per_minute_limit: Number(qMin), daily_limit: Number(qDay) } });
      toast.success("Quota updated");
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp";
  const usagePct = state ? Math.min(100, Math.round((state.quota.usedToday / state.quota.dailyLimit) * 100)) : 0;

  return (
    <div>
      <PageHeader
        title="Agent Access"
        description="Give AI agents controlled access to your workspace over MCP — with keys, permissions, quotas, and a full audit trail."
        actions={<Badge variant="secondary" className="gap-1"><Bot className="h-3 w-3" /> MCP · streamable HTTP</Badge>}
      />

      <Tabs defaultValue="console">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="console"><Play className="mr-1.5 h-3.5 w-3.5" /> Test console</TabsTrigger>
          <TabsTrigger value="access"><KeyRound className="mr-1.5 h-3.5 w-3.5" /> Keys & status</TabsTrigger>
          <TabsTrigger value="permissions"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Permissions</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="mr-1.5 h-3.5 w-3.5" /> Audit log</TabsTrigger>
          <TabsTrigger value="usage"><Gauge className="mr-1.5 h-3.5 w-3.5" /> Usage</TabsTrigger>
        </TabsList>

        {/* ---------------- Console ---------------- */}
        <TabsContent value="console">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
              <div>
                <Label>Tool</Label>
                <Select value={tool} onValueChange={(v) => { setTool(v); setArgsText(EXAMPLE_ARGS[v] ?? "{}"); setOutput(null); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(state?.tools ?? []).map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {state?.tools.find((t) => t.name === tool)?.description}
                </p>
              </div>
              <div>
                <Label>Arguments (JSON)</Label>
                <Textarea className="mt-1.5 font-mono text-xs" rows={7} value={argsText} onChange={(e) => setArgsText(e.target.value)} />
              </div>
              <Button onClick={() => void execute()} disabled={running || !state} className="w-full">
                {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run tool
              </Button>
              <p className="text-xs text-muted-foreground">
                Runs as you, through the same permission, quota, and audit gate agents use — every run appears in the audit log.
              </p>
            </CardContent></Card>

            <Card className="shadow-elegant"><CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Output</div>
                {output && <Badge className={statusBadge[output.status] ?? "bg-secondary"}>{output.status}</Badge>}
              </div>
              {output?.html && (
                <div className="mb-4 rounded-lg border bg-white p-4">
                  <div dangerouslySetInnerHTML={{ __html: output.html }} />
                </div>
              )}
              <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
                {output ? output.body : "Run a tool to see its result here."}
              </pre>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* ---------------- Keys & status ---------------- */}
        <TabsContent value="access">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 font-display text-lg font-semibold"><Plug className="h-4 w-4" /> Connection status</div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">MCP endpoint</div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{endpoint}</code>
                  <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(endpoint); toast.success("Endpoint copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Active keys</div>
                  <div className="mt-1 text-xl font-bold">{state ? state.keys.filter((k) => !k.revoked_at).length : "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Last agent call</div>
                  <div className="mt-1 text-sm font-medium">
                    {state?.lastAgentCall ? new Date(state.lastAgentCall.created_at).toLocaleString() : "Never"}
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                <div className="mb-1 font-semibold text-foreground">Agent setup</div>
                Auth header: <code>Authorization: Bearer sfk_…</code> · Protocol: MCP streamable HTTP (JSON-RPC: initialize, tools/list, tools/call).
                <br />Mailbox deployment (Gmail / Outlook) additionally uses the OAuth connections on the{" "}
                <Link to="/app/integrations" className="text-brand underline-offset-4 hover:underline">Integrations page</Link> — API keys govern the /api/mcp tools; provider OAuth governs pushing signatures into mailboxes.
              </div>
            </CardContent></Card>

            <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-4 w-4" /> API keys</div>
              {freshKey && (
                <div className="rounded-md border border-brand bg-brand/10 p-3">
                  <div className="text-xs font-semibold">Copy this key now — it won't be shown again.</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-background px-2 py-1 text-xs">{freshKey}</code>
                    <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(freshKey); toast.success("Key copied"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="flex gap-2">
                  <Input placeholder="Key name, e.g. Claude agent" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                  <Button onClick={() => void createKey()} disabled={keyBusy}>
                    {keyBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {(state?.keys ?? []).length === 0 && <p className="text-sm text-muted-foreground">No keys yet — create one to let an agent connect.</p>}
                {(state?.keys ?? []).map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-sm font-medium">{k.name} {k.revoked_at && <Badge variant="secondary" className="ml-1">revoked</Badge>}</div>
                      <div className="text-xs text-muted-foreground">
                        <code>{k.key_prefix}…</code> · {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleString()}` : "never used"}
                      </div>
                    </div>
                    {isAdmin && !k.revoked_at && (
                      <Button size="sm" variant="ghost" onClick={() => void revoke(k.id)}>
                        <Ban className="mr-1.5 h-3.5 w-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* ---------------- Permissions ---------------- */}
        <TabsContent value="permissions">
          <Card className="shadow-elegant"><CardContent className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Owners and admins can always call every tool. The <strong>agent</strong> row controls what API keys can do.
              {!isAdmin && " You need owner or admin role to change these."}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  {ROLES.map((r) => <TableHead key={r} className="text-center capitalize">{r}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(state?.tools ?? []).map((t) => (
                  <TableRow key={t.name}>
                    <TableCell>
                      <div className="text-sm font-medium"><code>{t.name}</code></div>
                      <div className="max-w-md text-xs text-muted-foreground">{t.description}</div>
                    </TableCell>
                    {ROLES.map((r) => {
                      const allowed = permMap.get(`${r}:${t.name}`) ?? true;
                      return (
                        <TableCell key={r} className="text-center">
                          <Switch checked={allowed} disabled={!isAdmin} onCheckedChange={(v) => void togglePerm(r, t.name, v)} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* ---------------- Audit ---------------- */}
        <TabsContent value="audit">
          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={auditTool} onValueChange={setAuditTool}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tools</SelectItem>
                {(state?.tools ?? []).map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={auditStatus} onValueChange={setAuditStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["ok", "denied", "rate_limited", "error"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Inputs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">ms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : audit.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No tool calls yet — run one in the test console.</TableCell></TableRow>
                ) : audit.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {r.actor} <span className="text-xs text-muted-foreground">{r.api_key_id ? "(agent)" : "(console)"}</span>
                    </TableCell>
                    <TableCell><code className="text-xs">{r.tool}</code></TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground">{r.input_summary}</TableCell>
                    <TableCell><Badge className={statusBadge[r.status] ?? "bg-secondary"}>{r.status}</Badge></TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground">{r.result_summary}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{r.duration_ms ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ---------------- Usage ---------------- */}
        <TabsContent value="usage">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
              <div className="font-display text-lg font-semibold">Current usage</div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Today</span>
                  <span className="tabular-nums">{state?.quota.usedToday ?? 0} / {state?.quota.dailyLimit ?? "—"} calls</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${usagePct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">This minute</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{state?.quota.usedThisMinute ?? 0} <span className="text-sm font-normal text-muted-foreground">/ {state?.quota.perMinuteLimit ?? "—"}</span></div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    {state && state.quota.usedToday < state.quota.dailyLimit
                      ? <><CheckCircle2 className="h-4 w-4 text-brand" /> Within limits</>
                      : <><XCircle className="h-4 w-4 text-destructive" /> Limit reached</>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Calls counted: successful and errored tool executions. Denied and rate-limited attempts don't consume quota.</p>
            </CardContent></Card>

            <Card className="shadow-elegant"><CardContent className="space-y-4 p-6">
              <div className="font-display text-lg font-semibold">Quota limits</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Per minute</Label><Input className="mt-1.5" type="number" value={qMin} onChange={(e) => setQMin(e.target.value)} disabled={!isAdmin} /></div>
                <div><Label>Per day</Label><Input className="mt-1.5" type="number" value={qDay} onChange={(e) => setQDay(e.target.value)} disabled={!isAdmin} /></div>
              </div>
              {isAdmin && <Button onClick={() => void saveQuota()}>Save limits</Button>}
              <p className="text-xs text-muted-foreground">Applies to the whole organization across all agents and the console. When a limit is hit, tools return <code>rate_limited</code> until the window resets.</p>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
