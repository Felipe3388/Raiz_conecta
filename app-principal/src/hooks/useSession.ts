"use client";

import { useSyncExternalStore } from "react";
import { api } from "@/lib/http/client";
import { isSessionRole, type SessionRole } from "@/lib/auth/client";

export interface ClientSession {
  email: string;
  role: SessionRole;
  nome: string;
  status: string;
}

interface Snapshot {
  session: ClientSession | null;
  loading: boolean;
}

// Quem está logado agora, perguntado ao servidor (o token fica num cookie que o JavaScript não lê).
// Um só pedido serve a todas as telas; ele se repete quando alguém entra ou sai (evento `loginStateChange`).
const LOADING: Snapshot = { session: null, loading: true };
let snapshot: Snapshot = LOADING;
let started = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function refreshSession(): Promise<void> {
  inflight ??= (async () => {
    const result = await api<Partial<ClientSession>>("/api/auth/me", { redirectOnUnauthorized: false, cache: "no-store" });
    const data = result.data;
    publish({
      loading: false,
      session:
        result.ok && data && typeof data.email === "string" && isSessionRole(data.role)
          ? { email: data.email, role: data.role, nome: data.nome || data.email, status: data.status ?? "" }
          : null,
    });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    window.addEventListener("loginStateChange", () => void refreshSession());
    void refreshSession();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useSession() {
  const { session, loading } = useSyncExternalStore(subscribe, () => snapshot, () => LOADING);
  return { session, loading, refresh: refreshSession };
}
