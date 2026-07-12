"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createWebhookAction, WEBHOOK_EVENTS } from "@/app/(server)/actions/webhooks";

const EVENT_LABELS: Record<string, string> = {
  "post.created": "Objava kreirana",
  "post.updated": "Objava ažurirana",
  "post.deleted": "Objava obrisana",
  "page.created": "Strana kreirana",
  "page.updated": "Strana ažurirana",
  "page.deleted": "Strana obrisana",
  "category.created": "Kategorija kreirana",
  "category.updated": "Kategorija ažurirana",
  "category.deleted": "Kategorija obrisana",
};

export default function CreateWebhookPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      const name = formData.get("name") as string;
      const url = formData.get("url") as string;
      const events = WEBHOOK_EVENTS.filter((ev) => formData.get(`event_${ev}`) === "on");

      startTransition(async () => {
        const result = await createWebhookAction({ name, url, events });
        if (result.success) {
          toast.success("Vebhuk kreiran");
          router.push("/admin/cms/webhooks");
        } else {
          toast.error(result.error || "Greška pri kreiranju");
        }
      });
    },
    [router, startTransition],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novi vebhuk</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kreiraj novi vebhuk koji će slati obaveštenja na spoljni URL.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/cms/webhooks">
            <Icon name="arrow_back" className="size-4" />
            Nazad
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Osnovne informacije</h3>

          <div className="space-y-1.5">
            <Label htmlFor="name">Naziv</Label>
            <Input
              id="name"
              name="name"
              placeholder="npr. Slack obaveštenja"
              required
              className="max-w-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              required
              className="max-w-lg"
            />
          </div>
        </div>

        {/* Events */}
        <div className="space-y-4 rounded-lg border p-6">
          <h3 className="text-sm font-semibold">Događaji</h3>
          <p className="text-muted-foreground text-xs">
            Izaberite događaje za koje želite da primate obaveštenja.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WEBHOOK_EVENTS.map((event) => (
              <Label
                key={event}
                className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex items-start gap-3 rounded-md border p-3"
              >
                <Checkbox name={`event_${event}`} value="on" />
                <div>
                  <span className="text-sm font-medium">{EVENT_LABELS[event]}</span>
                  <p className="text-muted-foreground text-xs">{event}</p>
                </div>
              </Label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            <Icon name="add" className="mr-1 size-4" />
            Kreiraj vebhuk
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/cms/webhooks">Odustani</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
