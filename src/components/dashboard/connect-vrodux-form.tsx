"use client";

import { useActionState } from "react";
import { connectVrodux, type ConnectVroduxState } from "@/modules/agencies/vrodux-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ConnectVroduxState = {};

export function ConnectVroduxForm() {
  const [state, formAction, pending] = useActionState(connectVrodux, initialState);

  return (
    <Card className="max-w-md space-y-4 p-6">
      <p className="text-sm text-sand-600">
        Paste your agency&apos;s VRODUX lead-intake webhook URL — the same one you&apos;d use for
        Property Finder, Bayut or a plain web form. Find it in VRODUX under Settings → Integrations →
        Webhooks. Every PropAxis enquiry for your listings will be posted there.
      </p>
      {state.error && <p className="rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>}
      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">VRODUX webhook URL</label>
          <Input name="vroduxWebhookUrl" type="url" required placeholder="https://vrodux.app/webhooks/leads/..." />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Connecting…" : "Connect VRODUX"}
        </Button>
      </form>
    </Card>
  );
}
