"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAgent, type RegisterAgentState } from "@/modules/agents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterAgentState = {};

export function AgentRegisterForm({ agencies }: { agencies: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(registerAgent, initialState);

  if (state.success) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-ink-950">Application submitted</h2>
        <p className="mt-2 text-sm text-sand-600">
          Your agent profile is pending verification by a PropAxis admin. Once approved, you can{" "}
          <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
            sign in
          </Link>{" "}
          and start publishing listings.
        </p>
      </div>
    );
  }

  if (agencies.length === 0) {
    return (
      <div>
        <p className="text-sm text-sand-600">
          There are no agencies registered on PropAxis yet — every agent must be affiliated with one, the
          same way Property Finder and Bayut require it.
        </p>
        <p className="mt-2 text-sm text-sand-600">
          If you&apos;re the first person from your agency,{" "}
          <Link href="/register?type=agency" className="font-medium text-ink-950 underline underline-offset-4">
            register your agency
          </Link>{" "}
          first, then come back here.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-sand-600">
        List properties, manage leads and clients. You&apos;ll need your RERA broker card number and an
        existing PropAxis agency to join.
      </p>
      {state.error && <p className="mt-4 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>}
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Full name</label>
          <Input name="name" required placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Email</label>
          <Input type="email" name="email" required placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Password</label>
          <Input type="password" name="password" required placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Phone (optional)</label>
          <Input type="tel" name="phone" placeholder="+971 5X XXX XXXX" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">RERA / broker card number</label>
          <Input name="ridNumber" required placeholder="e.g. BRN-12345" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Agency</label>
          <select name="agencyId" required className="h-11 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm">
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </>
  );
}
