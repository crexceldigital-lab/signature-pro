import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Upload, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/employees")({
  component: Employees,
});

interface Dept { id: string; name: string }
interface Emp {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  phone: string | null;
  status: string;
  department_id: string | null;
}

const emptyForm = { first_name: "", last_name: "", email: "", job_title: "", phone: "", department_id: "" };

/** Minimal CSV parser that handles quoted fields. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function Employees() {
  const { user } = useAuth();
  const orgId = user?.orgId ?? null;
  const [rows, setRows] = useState<Emp[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Emp | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newDept, setNewDept] = useState("");
  const csvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [emp, dep] = await Promise.all([
      supabase.from("employees").select("id,first_name,last_name,email,job_title,phone,status,department_id").eq("org_id", orgId).is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name").eq("org_id", orgId).order("name"),
    ]);
    if (emp.error) toast.error(emp.error.message);
    setRows((emp.data as Emp[]) ?? []);
    setDepts((dep.data as Dept[]) ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { void load(); }, [load]);

  const deptName = useMemo(() => Object.fromEntries(depts.map((d) => [d.id, d.name])), [depts]);

  const filtered = rows.filter(
    (r) =>
      (deptFilter === "all" || r.department_id === deptFilter) &&
      (q.trim() === "" || `${r.first_name} ${r.last_name} ${r.email} ${r.job_title ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (e: Emp) => {
    setEditing(e);
    setForm({
      first_name: e.first_name, last_name: e.last_name, email: e.email,
      job_title: e.job_title ?? "", phone: e.phone ?? "", department_id: e.department_id ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!orgId) return toast.error("No organization on your profile yet.");
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim())
      return toast.error("First name, last name, and email are required.");
    setSaving(true);
    const payload = {
      org_id: orgId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      job_title: form.job_title.trim() || null,
      phone: form.phone.trim() || null,
      department_id: form.department_id || null,
    };
    const res = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Employee updated" : "Employee added");
    setOpen(false);
    void load();
  };

  const remove = async (e: Emp) => {
    if (!window.confirm(`Remove ${e.first_name} ${e.last_name}?`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Employee removed");
    setRows((r) => r.filter((x) => x.id !== e.id));
  };

  const addDept = async () => {
    if (!orgId || !newDept.trim()) return;
    const { data, error } = await supabase.from("departments").insert({ org_id: orgId, name: newDept.trim() }).select("id,name").single();
    if (error) return toast.error(error.message);
    setDepts((d) => [...d, data as Dept].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, department_id: (data as Dept).id }));
    setNewDept("");
    toast.success("Department added");
  };

  const importCSV = async (file: File) => {
    if (!orgId) return toast.error("No organization on your profile yet.");
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) return toast.error("CSV needs a header row plus at least one employee.");
    const header = parsed[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
    const iFirst = idx(["first_name", "firstname", "first"]);
    const iLast = idx(["last_name", "lastname", "last", "surname"]);
    const iEmail = idx(["email", "email_address"]);
    const iTitle = idx(["job_title", "title", "position", "role"]);
    const iPhone = idx(["phone", "phone_number", "mobile"]);
    if (iFirst < 0 || iLast < 0 || iEmail < 0)
      return toast.error("CSV must include first_name, last_name, and email columns.");
    const payload = parsed.slice(1)
      .map((r) => ({
        org_id: orgId,
        first_name: r[iFirst]?.trim() ?? "",
        last_name: r[iLast]?.trim() ?? "",
        email: r[iEmail]?.trim().toLowerCase() ?? "",
        job_title: iTitle >= 0 ? r[iTitle]?.trim() || null : null,
        phone: iPhone >= 0 ? r[iPhone]?.trim() || null : null,
      }))
      .filter((r) => r.first_name && r.last_name && r.email.includes("@"));
    if (!payload.length) return toast.error("No valid rows found in the CSV.");
    const { error } = await supabase.from("employees").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`${payload.length} employee${payload.length === 1 ? "" : "s"} imported`);
    void load();
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Everyone who gets a signature. Bulk-import via CSV or add individually."
        actions={
          <>
            <Button variant="outline" onClick={() => csvRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> Bulk CSV
            </Button>
            <Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> Add employee</Button>
          </>
        }
      />
      <input
        ref={csvRef} type="file" accept=".csv,text/csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCSV(f); e.target.value = ""; }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, title…" className="pl-8" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} of {rows.length} shown</span>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                {rows.length === 0 ? "No employees yet — add your first one or import a CSV." : "No matches for this filter."}
              </TableCell></TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{e.first_name} {e.last_name}</div>
                    <div className="text-xs text-muted-foreground">{e.job_title ?? "—"}</div>
                  </TableCell>
                  <TableCell className="text-sm">{e.department_id ? deptName[e.department_id] ?? "—" : "—"}</TableCell>
                  <TableCell>
                    <div className="text-sm">{e.email}</div>
                    <div className="text-xs text-muted-foreground">{e.phone ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => void remove(e)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First name</Label><Input className="mt-1.5" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><Label>Last name</Label><Input className="mt-1.5" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Email</Label><Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Job title</Label><Input className="mt-1.5" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Department</Label>
              <Select value={form.department_id || "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? "" : v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-2 flex gap-2">
                <Input placeholder="New department name…" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => void addDept()} disabled={!newDept.trim()}>Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
