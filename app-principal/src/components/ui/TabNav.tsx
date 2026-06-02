"use client";
import { ReactNode } from "react";

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
}

export function TabNav({ tabs, activeTab, onTabChange, rightSlot, className = "" }: TabNavProps) {
  return (
    <div className={`flex justify-between items-end border-b border-gray-200 mb-6 ${className}`}>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rc-tab ${isActive ? "rc-tab-active" : "rc-tab-inactive"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rc-tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="pb-3">{rightSlot}</div>}
    </div>
  );
}
