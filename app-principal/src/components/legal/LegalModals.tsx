"use client";

import { ScrollText, ShieldCheck } from "lucide-react";
import { PrivacidadeContent } from "@/content/legal/privacidade";
import { TermosContent } from "@/content/legal/termos";
import { DocumentModal } from "./DocumentModal";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermosModal({ isOpen, onClose }: LegalModalProps) {
  return (
    <DocumentModal isOpen={isOpen} onClose={onClose} icon={ScrollText} tone="green" title="Termos de Uso" subtitle="Raiz Conecta — Plataforma de Agronegócio" closeLabel="Entendi e Concordo">
      <TermosContent />
    </DocumentModal>
  );
}

export function PrivacidadeModal({ isOpen, onClose }: LegalModalProps) {
  return (
    <DocumentModal isOpen={isOpen} onClose={onClose} icon={ShieldCheck} tone="blue" title="Política de Privacidade" subtitle="Raiz Conecta — Como tratamos seus dados">
      <PrivacidadeContent />
    </DocumentModal>
  );
}
