"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-slate-700";

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul className="mt-1 text-xs text-red-600">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-semibold">{isSignup ? "Create your account" : "Log in"}</h1>

      {isSignup && (
        <label className="block text-sm">
          Name
          <input name="name" autoComplete="name" defaultValue={state?.values?.name} className={inputClass} />
          <FieldErrors errors={state?.errors?.name} />
        </label>
      )}

      <label className="block text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          className={inputClass}
        />
        <FieldErrors errors={state?.errors?.email} />
      </label>

      <label className="block text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          className={inputClass}
        />
        {isSignup && !state?.errors?.password && (
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        )}
        <FieldErrors errors={state?.errors?.password} />
      </label>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-emerald-600 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
