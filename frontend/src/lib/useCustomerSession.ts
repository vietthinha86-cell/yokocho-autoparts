"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  clearStoredCustomerToken,
  CUSTOMER_AUTH_EVENT,
  fetchCustomerSession,
  getStoredCustomerToken,
} from "@/lib/customerApi";
import type {
  CustomerProfile,
  InstallationBookingRecord,
  OrderRecord,
} from "@/types/autoparts";

interface SessionCacheState {
  token: string | null;
  customer: CustomerProfile | null;
  orders: OrderRecord[];
  bookings: InstallationBookingRecord[];
  loaded: boolean;
}

function subscribeToken(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CUSTOMER_AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CUSTOMER_AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerToken(): string | null {
  return null;
}

export function useCustomerSession() {
  const token = useSyncExternalStore(
    subscribeToken,
    getStoredCustomerToken,
    getServerToken,
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [state, setState] = useState<SessionCacheState>({
    token: null,
    customer: null,
    orders: [],
    bookings: [],
    loaded: false,
  });

  useEffect(() => {
    const onAuthChanged = () => setRefreshTick((n) => n + 1);
    window.addEventListener(CUSTOMER_AUTH_EVENT, onAuthChanged);
    return () => window.removeEventListener(CUSTOMER_AUTH_EVENT, onAuthChanged);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchCustomerSession(token).then((res) => {
      if (cancelled) return;
      if (res.unauthorized) {
        clearStoredCustomerToken();
        setState({ token: null, customer: null, orders: [], bookings: [], loaded: true });
        return;
      }
      if (res.ok && res.customer) {
        setState({
          token,
          customer: res.customer,
          orders: res.orders ?? [],
          bookings: res.bookings ?? [],
          loaded: true,
        });
      } else {
        setState((prev) => ({
          token,
          customer: prev.token === token ? prev.customer : null,
          orders: prev.token === token ? prev.orders : [],
          bookings: prev.token === token ? prev.bookings : [],
          loaded: true,
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, refreshTick]);

  const reloadSession = useCallback(() => {
    setRefreshTick((n) => n + 1);
  }, []);

  const logout = useCallback(() => {
    clearStoredCustomerToken();
  }, []);

  const isMatchingToken = Boolean(token && state.token === token);
  const customer = isMatchingToken ? state.customer : null;
  const orders = isMatchingToken ? state.orders : [];
  const bookings = isMatchingToken ? state.bookings : [];
  const loading = Boolean(token) && (!isMatchingToken || !state.loaded);

  return {
    token,
    customer,
    orders,
    bookings,
    loading,
    reloadSession,
    logout,
  };
}
