"use client";

import {
  buildPhoneNumberValue,
  getPhoneCountryByCode,
  parsePhoneNumberValue,
  PHONE_COUNTRY_OPTIONS,
  sanitizePhoneDigits,
  type PhoneInputValue,
} from "@/lib/phone";
import { cn } from "@/utils";

type PhoneInputWithCountryProps = {
  className?: string;
  disabled?: boolean;
  error?: string | null;
  id?: string;
  label?: string;
  onChange: (fullNumber: string) => void;
  onValueChange?: (value: PhoneInputValue) => void;
  placeholder?: string;
  required?: boolean;
  value?: string | null;
};

const containerClassName =
  "flex overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white focus-within:border-[color:var(--color-primary)] focus-within:ring-2 focus-within:ring-[color:var(--color-primary-soft)]";

export function PhoneInputWithCountry({
  className,
  disabled = false,
  error,
  id,
  label,
  onChange,
  onValueChange,
  placeholder = "Numero",
  required = false,
  value,
}: PhoneInputWithCountryProps) {
  const phoneValue = parsePhoneNumberValue(value);

  const emitChange = (nextValue: PhoneInputValue) => {
    onChange(nextValue.fullNumber);
    onValueChange?.(nextValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label className="text-sm font-medium text-stone-700" htmlFor={id}>
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
      ) : null}
      <div className={containerClassName}>
        <select
          className="h-11 w-[9.5rem] border-r border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[color:var(--color-text)] outline-none disabled:cursor-not-allowed"
          disabled={disabled}
          onChange={(event) => {
            const nextValue = buildPhoneNumberValue(
              event.target.value,
              phoneValue.nationalNumber,
            );
            emitChange(nextValue);
          }}
          value={phoneValue.countryCode}
        >
          {PHONE_COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {country.dialCode} · {country.name}
            </option>
          ))}
        </select>
        <input
          autoComplete="tel-national"
          className="h-11 flex-1 bg-white px-3.5 text-sm text-[color:var(--color-text)] outline-none placeholder:text-stone-400 disabled:cursor-not-allowed"
          disabled={disabled}
          id={id}
          inputMode="numeric"
          onChange={(event) => {
            const nextValue = buildPhoneNumberValue(
              phoneValue.countryCode,
              sanitizePhoneDigits(event.target.value),
            );
            emitChange(nextValue);
          }}
          placeholder={`${placeholder} (${getPhoneCountryByCode(phoneValue.countryCode).dialCode})`}
          type="tel"
          value={phoneValue.nationalNumber}
        />
      </div>
      {phoneValue.fullNumber ? (
        <p className="text-xs text-[color:var(--color-text-muted)]">
          Guardado como {phoneValue.fullNumber}
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
