import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

/**
 * Format a number as SAR currency (abbreviated for large values).
 * Examples: 1234 → "SAR 1,234", 14450000 → "SAR 14.45M"
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `SAR ${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `SAR ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `SAR ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `SAR ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with locale-aware thousand separators.
 * Examples: 1975 → "1,975"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Format a percentage with two decimal places.
 * Examples: 0.1234 → "0.12%", 1.80 → "1.80%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Abbreviate large revenue numbers for chart axis ticks.
 * Examples: 300000 → "300K", 1200000 → "1.2M"
 */
export function abbreviateNumber(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(value);
}

/**
 * Format an ISO date string for display.
 * Examples: "2026-02-18T..." → "18/02/2026"
 */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
