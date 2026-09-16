"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser, type RegisterState } from "@/modules/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-8 shadow-sm">
          {state.success ? (
            <div>
              <h1 className="text-xl font-semibold text-ink-950">Account created</h1>
              <p className="mt-2 text-sm text-sand-600">
                You can now{" "}
                <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
                  sign in
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-ink-950">Create your account</h1>
              <p className="mt-1 text-sm text-sand-600">Search, save and connect with agents across the UAE.</p>

              {state.error && (
                <p className="mt-4 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-danger">{state.error}</p>
              )}

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

              <p className="mt-6 text-center text-sm text-sand-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
