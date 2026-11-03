"use client";
import { ReactNode, useRef } from "react";

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  color?: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  rightSlot?: ReactNode;
  className?: string;
  // Nome da lista de abas para leitores de tela.
  label?: string;
}

// O painel de cada aba leva `id={tabPanelId(id)}`, `role="tabpanel"` e `aria-labelledby={tabId(id)}`.
export const tabId = (id: string) => `tab-${id}`;
export const tabPanelId = (id: string) => `panel-${id}`;

export function TabNav({ tabs, activeTab, onTabChange, rightSlot, className = "", label = "Seções" }: TabNavProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Setas esquerda/direita, Home e End trocam de aba (como no padrão de abas do teclado).
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    const next = tabs[target];
    onTabChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div className={`flex justify-between items-end border-b border-gray-200 mb-6 ${className}`}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[tab.id] = node;
              }}
              id={tabId(tab.id)}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={tabPanelId(tab.id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`rc-tab ${isActive ? "rc-tab-active" : "rc-tab-inactive"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rc-tab-badge" aria-label={`${tab.badge} pendentes`}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="pb-3">{rightSlot}</div>}
    </div>
  );
}
