"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser, type RegisterState } from "@/modules/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterState = {};

export function BuyerRegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  if (state.success) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-ink-950">Account created</h2>
        <p className="mt-2 text-sm text-sand-600">
          You can now{" "}
          <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-sand-600">Search, save and connect with agents across the UAE.</p>
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
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </>
  );
}
