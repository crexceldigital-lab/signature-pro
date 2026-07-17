import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Upload, Plus, Trash2, Pencil, Power } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEmployees, departments, type Employee } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/employees")({
  component: Employees,
});

function Employees() {
  const [rows, setRows] = useState<Employee[]>(mockEmployees);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");

  const list = useMemo(() => {
    return rows.filter((r) => {
      const t = `${r.firstName} ${r.lastName} ${r.email} ${r.jobTitle}`.toLowerCase();
      const okQ = !q || t.includes(q.toLowerCase());
      const okD = dept === "all" || r.department === dept;
      return okQ && okD;
    });
  }, [rows, q, dept]);

  const toggleStatus = (id: string) =>
    setRows((r) => r.map((e) => (e.id === id ? { ...e, status: e.status === "active" ? "inactive" : "active" } : e)));
  const remove = (id: string) => {
    setRows((r) => r.filter((e) => e.id !== id));
    toast.success("Employee removed");
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage teammates, roles, and departments. Bulk-import via CSV or add individually."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("CSV importer coming online (mock)")}>
              <Upload className="mr-1.5 h-4 w-4" /> Bulk CSV
            </Button>
            <Button onClick={() => toast.info("Opening new employee form (mock)")}>
              <Plus className="mr-1.5 h-4 w-4" /> Add employee
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search employees…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">{list.length} of {rows.length} shown</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{e.firstName[0]}{e.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{e.firstName} {e.lastName}</div>
                      <div className="text-xs text-muted-foreground">{e.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><span className="text-sm">{e.jobTitle}</span></TableCell>
                <TableCell><Badge variant="secondary">{e.department}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "active" ? "default" : "outline"} className={e.status === "active" ? "bg-brand text-brand-foreground" : ""}>
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => toast.info("Editing (mock)")}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleStatus(e.id)}><Power className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}