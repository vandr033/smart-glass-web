export type PhoneCountryOption = {
  code: string;
  dialCode: string;
  name: string;
};

export type PhoneInputValue = {
  countryCode: string;
  dialCode: string;
  fullNumber: string;
  nationalNumber: string;
};

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: "BO", dialCode: "+591", name: "Bolivia" },
  { code: "PE", dialCode: "+51", name: "Peru" },
  { code: "CL", dialCode: "+56", name: "Chile" },
  { code: "AR", dialCode: "+54", name: "Argentina" },
  { code: "BR", dialCode: "+55", name: "Brasil" },
  { code: "PY", dialCode: "+595", name: "Paraguay" },
  { code: "UY", dialCode: "+598", name: "Uruguay" },
  { code: "CO", dialCode: "+57", name: "Colombia" },
  { code: "MX", dialCode: "+52", name: "Mexico" },
  { code: "US", dialCode: "+1", name: "Estados Unidos" },
] as const;

const DEFAULT_COUNTRY = PHONE_COUNTRY_OPTIONS[0];

export const sanitizePhoneDigits = (value: string): string => {
  return value.replace(/\D+/g, "");
};

export const getPhoneCountryByCode = (countryCode: string): PhoneCountryOption => {
  return (
    PHONE_COUNTRY_OPTIONS.find((country) => country.code === countryCode) ?? DEFAULT_COUNTRY
  );
};

export const buildPhoneNumberValue = (
  countryCode: string,
  nationalNumber: string,
): PhoneInputValue => {
  const country = getPhoneCountryByCode(countryCode);
  const sanitizedNationalNumber = sanitizePhoneDigits(nationalNumber);

  return {
    countryCode: country.code,
    dialCode: country.dialCode,
    fullNumber: sanitizedNationalNumber
      ? `${country.dialCode}${sanitizedNationalNumber}`
      : "",
    nationalNumber: sanitizedNationalNumber,
  };
};

export const parsePhoneNumberValue = (
  rawValue: string | null | undefined,
  fallbackCountryCode = DEFAULT_COUNTRY.code,
): PhoneInputValue => {
  const fallbackCountry = getPhoneCountryByCode(fallbackCountryCode);
  const value = (rawValue ?? "").trim();

  if (!value) {
    return {
      countryCode: fallbackCountry.code,
      dialCode: fallbackCountry.dialCode,
      fullNumber: "",
      nationalNumber: "",
    };
  }

  const normalizedValue = value.replace(/[^\d+]/g, "");

  if (!normalizedValue.startsWith("+")) {
    return buildPhoneNumberValue(fallbackCountry.code, normalizedValue);
  }

  const country = [...PHONE_COUNTRY_OPTIONS]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((option) => normalizedValue.startsWith(option.dialCode));

  if (!country) {
    return buildPhoneNumberValue(fallbackCountry.code, normalizedValue.replace(/^\+/, ""));
  }

  const nationalNumber = normalizedValue.slice(country.dialCode.length);
  return buildPhoneNumberValue(country.code, nationalNumber);
};
