"use client";

import { useSyncExternalStore } from "react";
import type { AutoPartProduct, CartItem } from "@/types/autoparts";

const CART_STORAGE_KEY = "akari_yokocho_cart_v1";
const CART_EVENT = "yokocho-cart-change";
const EMPTY_CART: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedParsed: CartItem[] = EMPTY_CART;

function readCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedParsed;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedParsed = EMPTY_CART;
      return cachedParsed;
    }
    const parsed = JSON.parse(raw);
    cachedParsed = Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY_CART;
    return cachedParsed;
  } catch {
    cachedParsed = EMPTY_CART;
    return EMPTY_CART;
  }
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onChange = () => callback();
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeStoredCart(nextCart: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(nextCart);
    cachedRaw = serialized;
    cachedParsed = nextCart;
    window.localStorage.setItem(CART_STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    // Ignore storage quota / privacy mode write errors gracefully
  }
}

export function addProductsToStoredCart(
  additions: Array<{ product: AutoPartProduct; selectedKelvin?: string; quantity?: number }>,
): CartItem[] {
  let next = [...readCartSnapshot()];
  for (const entry of additions) {
    const kelvin =
      entry.selectedKelvin ?? entry.product.specs.kelvin?.[0] ?? "Tiêu chuẩn";
    const qty = entry.quantity ?? 1;
    const idx = next.findIndex(
      (i) => i.product.id === entry.product.id && i.selectedKelvin === kelvin,
    );
    if (idx >= 0) {
      next = next.map((item, i) =>
        i === idx ? { ...item, quantity: item.quantity + qty } : item,
      );
    } else {
      next.push({ product: entry.product, quantity: qty, selectedKelvin: kelvin });
    }
  }
  writeStoredCart(next);
  return next;
}

export function updateStoredCartQty(
  productId: string,
  selectedKelvin: string,
  delta: number,
): void {
  const next = readCartSnapshot()
    .map((item) =>
      item.product.id === productId && item.selectedKelvin === selectedKelvin
        ? { ...item, quantity: item.quantity + delta }
        : item,
    )
    .filter((item) => item.quantity > 0);
  writeStoredCart(next);
}

export function removeStoredCartItem(
  productId: string,
  selectedKelvin: string,
): void {
  const next = readCartSnapshot().filter(
    (item) =>
      !(item.product.id === productId && item.selectedKelvin === selectedKelvin),
  );
  writeStoredCart(next);
}

export function clearStoredCart(): void {
  writeStoredCart([]);
}

export function usePersistentCart(): CartItem[] {
  return useSyncExternalStore(subscribe, readCartSnapshot, getServerSnapshot);
}

