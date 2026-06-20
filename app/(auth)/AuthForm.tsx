"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, Input, Button } from "@/components/ui";
import { popIn } from "@/lib/motion";
import { USERNAME_RULE } from "@/lib/auth/username";
import type { AuthResult } from "./actions";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  action: (prev: AuthResult, formData: FormData) => Promise<AuthResult>;
};

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending
        ? "Please wait…"
        : mode === "login"
          ? "Sign in"
          : "Create account"}
    </Button>
  );
}

export function AuthForm({ mode, action }: Props) {
  const [state, formAction] = useFormState<AuthResult, FormData>(
    action,
    undefined
  );
  const isSignup = mode === "signup";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-12">
      <motion.div
        variants={popIn}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-from to-primary-to text-2xl shadow-glass-lift">
            <span aria-hidden>🥒</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink">PickleIT</h1>
          <p className="mt-1 text-sm text-ink/60">
            {isSignup ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <Card className="p-6">
          <form action={formAction} className="flex flex-col gap-4">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="your username"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
            />

            {isSignup && (
              <p className="px-1 text-[11px] text-ink/50">{USERNAME_RULE}</p>
            )}

            {state?.error && (
              <p
                role="alert"
                className="rounded-2xl bg-red-50/80 px-3 py-2 text-sm text-red-700"
              >
                {state.error}
              </p>
            )}

            <SubmitButton mode={mode} />
          </form>

          <p className="mt-5 text-center text-sm text-ink/60">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/signup" className="font-semibold text-primary">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </Card>

        {isSignup && (
          <p className="mt-4 text-center text-[11px] text-ink/40">
            The first account becomes the Admin. Later sign-ups need Admin
            approval before they can use the app.
          </p>
        )}
      </motion.div>
    </main>
  );
}
