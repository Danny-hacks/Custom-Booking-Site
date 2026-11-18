"use client";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/actions";

type L = Record<string, string>;

export function AuthForms({ locale, labels }: { locale: string; labels: L }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [ls, la, lp] = useActionState<FormState, FormData>(login, {});
  const [rs, ra, rp] = useActionState<FormState, FormData>(register, {});
  const isLogin = mode === "login";
  const state = isLogin ? ls : rs;
  return (
    <form action={isLogin ? la : ra} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {!isLogin && (
        <div><label className="label" htmlFor="a-name">{labels.name}</label><input id="a-name" name="name" required autoComplete="name" className="field" /></div>
      )}
      <div><label className="label" htmlFor="a-email">{labels.email}</label><input id="a-email" name="email" type="email" required autoComplete="email" className="field" /></div>
      <div><label className="label" htmlFor="a-pw">{labels.password}</label><input id="a-pw" name="password" type="password" required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? "current-password" : "new-password"} className="field" /></div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={lp || rp}>{isLogin ? labels.login : labels.register}</button>
      <p className="text-center text-sm text-ink-soft">
        {isLogin ? labels.noAccount : labels.haveAccount}{" "}
        <button type="button" className="font-semibold text-brand underline" onClick={() => setMode(isLogin ? "register" : "login")}>
          {isLogin ? labels.register : labels.login}
        </button>
      </p>
    </form>
  );
}
