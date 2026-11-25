/**
 * Tiny validation helpers (no dependencies).
 *
 *   const v = useValidation(form, {
 *     email: [rules.required('Enter your email'), rules.email()],
 *     phone: [rules.pkMobile()],
 *   })
 *   v.touch('email')          // on blur
 *   if (!v.validateAll()) return  // on submit, shows every error
 *   <FormField :error="v.error('email')">…
 *
 * A rule returns `true` when valid or an error message string.
 */
import { reactive } from 'vue'
import { isCnic, isPkMobile } from './utils'

export type Rule<T = any> = (value: T) => true | string

const empty = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export const rules = {
  required: (msg = 'This field is required.'): Rule => v => (empty(v) ? msg : true),
  email: (msg = 'Enter a valid email address.'): Rule<string> => v => (empty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : msg),
  url: (msg = 'Enter a valid link starting with https://'): Rule<string> => v => (empty(v) || /^https?:\/\/\S+\.\S+/.test(v) ? true : msg),
  minLength: (n: number, msg?: string): Rule<string> => v => (empty(v) || String(v).length >= n ? true : msg ?? `Use at least ${n} characters.`),
  maxLength: (n: number, msg?: string): Rule<string> => v => (empty(v) || String(v).length <= n ? true : msg ?? `Use ${n} characters or fewer.`),
  min: (n: number, msg?: string): Rule<number | null> => v => (empty(v) || Number(v) >= n ? true : msg ?? `Must be at least ${n.toLocaleString('en-PK')}.`),
  max: (n: number, msg?: string): Rule<number | null> => v => (empty(v) || Number(v) <= n ? true : msg ?? `Must be ${n.toLocaleString('en-PK')} or less.`),
  pkMobile: (msg = 'Enter a Pakistani mobile number like 0300-1234567.'): Rule<string> => v => (empty(v) || isPkMobile(v) ? true : msg),
  cnic: (msg = 'Enter a CNIC like 35202-1234567-1.'): Rule<string> => v => (empty(v) || isCnic(v) ? true : msg),
  sameAs: (other: () => unknown, msg = 'The values do not match.'): Rule => v => (empty(v) || v === other() ? true : msg),
}

/** Run rules in order and return the first message, or '' when valid. */
export function validate<T>(value: T, list: Rule<T>[] = []): string {
  for (const r of list) {
    const res = r(value)
    if (res !== true) return res
  }
  return ''
}

export function useValidation<F extends Record<string, any>>(form: F, schema: Partial<Record<keyof F, Rule[]>>) {
  const keys = Object.keys(schema) as (keyof F)[]
  const touched = reactive<Record<string, boolean>>({})
  const state = reactive({ submitted: false })

  const messageFor = (k: keyof F) => validate(form[k], schema[k] ?? [])
  return {
    touched,
    /** Message to show (only after the field was touched or the form submitted). */
    error: (k: keyof F) => (touched[k as string] || state.submitted ? messageFor(k) : ''),
    touch: (k: keyof F) => { touched[k as string] = true },
    validateField: (k: keyof F) => { touched[k as string] = true; return !messageFor(k) },
    validateAll: () => { state.submitted = true; return keys.every(k => !messageFor(k)) },
    reset: () => { state.submitted = false; for (const k of Object.keys(touched)) delete touched[k] },
  }
}
