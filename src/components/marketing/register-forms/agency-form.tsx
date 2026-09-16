"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAgency, type RegisterAgencyState } from "@/modules/agencies/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterAgencyState = {};

export function AgencyRegisterForm() {
  const [state, formAction, pending] = useActionState(registerAgency, initialState);

  if (state.success) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-ink-950">Application submitted</h2>
        <p className="mt-2 text-sm text-sand-600">
          Your agency is pending verification by a PropAxis admin. Once approved, you (and any agents
          who join under it) can{" "}
          <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
            sign in
          </Link>{" "}
          and start publishing listings.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-sand-600">
        Register your brokerage. You&apos;ll be the first admin — invite your agents to join once
        you&apos;re verified.
      </p>
      {state.error && <p className="mt-4 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>}
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Agency name</label>
          <Input name="agencyName" required placeholder="Horizon Realty" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Trade license / RERA (ORN) number</label>
          <Input name="ridNumber" required placeholder="e.g. ORN-6789" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Website (optional)</label>
          <Input type="url" name="website" placeholder="https://" />
        </div>
        <hr className="border-sand-200" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Your name (primary admin)</label>
          <Input name="contactName" required placeholder="Jane Doe" />
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
          <Input type="tel" name="phone" placeholder="+971 4 XXX XXXX" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Register agency"}
        </Button>
      </form>
    </>
  );
}
