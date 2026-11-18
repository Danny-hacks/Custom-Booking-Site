"use client";
import { useActionState, useState } from "react";
import { startCheckout, type FormState } from "@/app/actions";
import { Icon } from "./Icon";

type Labels = Record<string, string>;

export function CheckoutForm({
  hidden, labels, signedIn, defaults, total, demo,
}: {
  hidden: Record<string, string>; labels: Labels; signedIn: boolean; defaults: { name: string; email: string }; total: string; demo: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(startCheckout, {});
  const [acct, setAcct] = useState(false);
  return (
    <form action={action} className="space-y-5">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <h2 className="text-2xl">{labels.yourDetails}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">{labels.name}</label><input id="name" name="name" required autoComplete="name" defaultValue={defaults.name} className="field" /></div>
        <div><label className="label" htmlFor="email">{labels.email}</label><input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaults.email} className="field" /></div>
      </div>
      <div><label className="label" htmlFor="phone">{labels.phone}</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="field sm:max-w-xs" /></div>
      <div><label className="label" htmlFor="notes">{labels.notes}</label><textarea id="notes" name="notes" placeholder={labels.notesPh} className="field" /></div>

      {!signedIn && (
        <div className="rounded-xl border border-line bg-paper p-4">
          <label className="flex cursor-pointer items-center gap-3 font-medium">
            <input type="checkbox" name="createAccount" checked={acct} onChange={(e) => setAcct(e.target.checked)} className="h-5 w-5 accent-[var(--brand)]" />
            {labels.createAccount}
          </label>
          {acct && (
            <div className="mt-3">
              <label className="label" htmlFor="password">{labels.password}</label>
              <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="field sm:max-w-xs" />
            </div>
          )}
        </div>
      )}

      {state.error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#fbe9e7] p-3 text-danger"><Icon name="warn" size={20} />{state.error}</p>}

      <button className="btn w-full text-lg sm:w-auto" disabled={pending}>
        <Icon name="lock" size={20} weight="bold" /> {pending ? "…" : `${labels.pay} ${total}`}
      </button>
      <p className="text-sm text-ink-soft">{labels.secure}</p>
      {demo && <p className="rounded-lg bg-tint px-3 py-2 text-sm text-brand-deep">{labels.demoNote}</p>}
      <p className="text-xs text-ink-soft">{labels.agree}</p>
    </form>
  );
}
