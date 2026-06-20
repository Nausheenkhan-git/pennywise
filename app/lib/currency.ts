// app/lib/currency.ts

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to QAR (base currency)
};

export const currencies: Currency[] = [
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.27 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.25 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.21 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 22.50 },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', rate: 75.00 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', rate: 1.02 },
  { code: 'AED', symbol: 'DH', name: 'UAE Dirham', rate: 1.00 },
];

export const getCurrency = (code: string): Currency => {
  const currency = currencies.find(c => c.code === code);
  return currency || currencies[0];
};

export const formatAmount = (amount: number, currencyCode: string = 'QAR'): string => {
  const currency = getCurrency(currencyCode);
  return `${currency.symbol} ${amount.toFixed(2)}`;
};

export const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const from = getCurrency(fromCurrency);
  const to = getCurrency(toCurrency);
  
  // Convert from base (QAR) to target
  if (fromCurrency === 'QAR') {
    return amount * to.rate;
  }
  
  // Convert from other currency to QAR first, then to target
  const inQAR = amount / from.rate;
  return inQAR * to.rate;
};

export const getDefaultCurrency = (): string => {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved) return saved;
  }
  return 'QAR';
};

export const savePreferredCurrency = (currencyCode: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredCurrency', currencyCode);
  }
};