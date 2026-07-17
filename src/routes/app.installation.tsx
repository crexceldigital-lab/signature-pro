import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/installation")({
  component: Installation,
});

const guides = [
  { name: "Gmail (Web)", steps: ["Open Gmail and click the gear icon → See all settings", "Under General, scroll to Signature", "Click Create new, name it, then paste your signature", "Select it as default for new mails and replies", "Save changes at the bottom of the page"] },
  { name: "Outlook Desktop (Windows)", steps: ["File → Options → Mail → Signatures", "Click New, enter a name, click OK", "Paste your signature into the editor", "Set default signatures per account", "Click OK to save"] },
  { name: "Outlook Web", steps: ["Click gear icon → View all Outlook settings", "Mail → Compose and reply", "Paste signature under Email signature", "Toggle auto-include on new messages and replies", "Save"] },
  { name: "Apple Mail", steps: ["Mail → Settings → Signatures", "Select account, click + to add", "Paste signature (keep 'Always match my default font' unchecked)", "Choose signature under 'Choose Signature' per account", "Close settings"] },
  { name: "Microsoft 365 (Org-wide)", steps: ["Sign in to Exchange admin center", "Mail flow → Rules → new rule", "Apply disclaimer to all messages", "Paste HTML into disclaimer", "Save and enable"] },
  { name: "Thunderbird", steps: ["Account Settings → select account", "Enable 'Attach the signature from a file'", "Choose signature.html", "Restart Thunderbird", "Compose a test email"] },
];

function Installation() {
  return (
    <div>
      <PageHeader title="Installation guides" description="Step-by-step install instructions for every major email client." />

      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((g) => (
          <Card key={g.name} className="shadow-elegant">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{g.name}</div>
                <Badge variant="secondary">{g.steps.length} steps</Badge>
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="steps">
                  <AccordionTrigger>View instructions</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                      {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}