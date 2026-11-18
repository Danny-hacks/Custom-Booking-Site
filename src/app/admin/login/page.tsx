"use client";
import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";
import { Icon } from "@/components/Icon";

export default function AdminLogin() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-paper p-7">
        <span className="grid h-11 w-11 place-items-center rounded-t-full rounded-b-md bg-brand text-white"><Icon name="house" weight="fill" /></span>
        <h1 className="text-3xl">Owner login</h1>
        <input type="hidden" name="admin" value="1" />
        <input type="hidden" name="locale" value="en" />
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" className="field" /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" name="password" type="password" required autoComplete="current-password" className="field" /></div>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <button className="btn w-full" disabled={pending}>Log in</button>
      </form>
    </main>
  );
}
