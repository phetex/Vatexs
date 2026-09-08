export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // matches a CURRENCIES code in ./currency
}

// Curated list — every currency referenced here exists in CURRENCIES (src/lib/currency.ts).
export const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', currency: 'EUR' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'EG', name: 'Egypt', currency: 'USD' },
  { code: 'MA', name: 'Morocco', currency: 'USD' },
  { code: 'ET', name: 'Ethiopia', currency: 'USD' },
  { code: 'TZ', name: 'Tanzania', currency: 'USD' },
  { code: 'UG', name: 'Uganda', currency: 'USD' },
  { code: 'RW', name: 'Rwanda', currency: 'USD' },
  { code: 'SN', name: 'Senegal', currency: 'USD' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'USD' },
  { code: 'CM', name: 'Cameroon', currency: 'USD' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'USD' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'USD' },
  { code: 'QA', name: 'Qatar', currency: 'USD' },
  { code: 'SG', name: 'Singapore', currency: 'USD' },
  { code: 'MY', name: 'Malaysia', currency: 'USD' },
  { code: 'PH', name: 'Philippines', currency: 'USD' },
  { code: 'PK', name: 'Pakistan', currency: 'USD' },
  { code: 'BD', name: 'Bangladesh', currency: 'USD' },
  { code: 'NZ', name: 'New Zealand', currency: 'AUD' },
  { code: 'BR', name: 'Brazil', currency: 'USD' },
  { code: 'MX', name: 'Mexico', currency: 'USD' },
  { code: 'JM', name: 'Jamaica', currency: 'USD' },
  { code: 'TR', name: 'Turkey', currency: 'USD' },
  { code: 'CH', name: 'Switzerland', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', currency: 'EUR' },
  { code: 'NO', name: 'Norway', currency: 'EUR' },
  { code: 'DK', name: 'Denmark', currency: 'EUR' },
  { code: 'PL', name: 'Poland', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', currency: 'EUR' },
  { code: 'JP', name: 'Japan', currency: 'USD' },
  { code: 'CN', name: 'China', currency: 'USD' },
  { code: 'KR', name: 'South Korea', currency: 'USD' },
  { code: 'ZM', name: 'Zambia', currency: 'USD' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD' },
  { code: 'OTHER', name: 'Other', currency: 'USD' },
];

const byCode: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function countryName(code: string | null | undefined) {
  if (!code) return null;
  return byCode[code]?.name ?? null;
}

export function currencyForCountry(code: string | null | undefined) {
  if (!code) return null;
  return byCode[code]?.currency ?? null;
}
