"use client";

import { useRef, useState, useEffect } from "react";
import type { PanelId, DragData } from "@/lib/types";
import { PANEL_META, ALL_PANEL_IDS } from "@/lib/panels";

interface DraggableTabBarProps {
  columnId: string;
  panels: PanelId[];
  activeIndex: number;
  canCloseColumn: boolean;
  onSelect: (index: number) => void;
  onClose: (index: number) => void;
  onAddPanel: (panelId: PanelId) => void;
  onCloseColumn: () => void;
  onDragStart: (data: DragData) => void;
  onDragEnd: () => void;
  onDropOnTab: (columnId: string, tabIndex: number) => void;
  onDropOnColumn: (columnId: string) => void;
}

export function DraggableTabBar({
  columnId,
  panels,
  activeIndex,
  canCloseColumn,
  onSelect,
  onClose,
  onAddPanel,
  onCloseColumn,
  onDragStart,
  onDragEnd,
  onDropOnTab,
  onDropOnColumn,
}: DraggableTabBarProps) {
  const [dragOverTab, setDragOverTab] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const dragDataRef = useRef<DragData | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const availablePanels = ALL_PANEL_IDS.filter(
    (p) => p !== "command" && !panels.includes(p)
  );

  if (panels.length === 0) {
    return (
      <div
        className={`tab-bar empty ${dragOverColumn ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOverColumn(true); }}
        onDragLeave={() => setDragOverColumn(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverColumn(false);
          onDropOnColumn(columnId);
        }}
      >
        <span className="tab-bar-empty-label">DROP PANEL HERE</span>
        <div className="tab-bar-actions" ref={pickerRef}>
          <button
            className="tab-add-btn"
            onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
            title="Add panel"
          >+
          </button>
          {canCloseColumn && (
            <button
              className="tab-close-column-btn"
              onClick={(e) => { e.stopPropagation(); onCloseColumn(); }}
              title="Close column"
            >
              ×
            </button>
          )}
          {showPicker && (
            <div className="panel-picker-dropdown">
              {availablePanels.length === 0 ? (
                <div className="panel-picker-empty">All panels in use</div>
              ) : (
                availablePanels.map((p) => (
                  <button
                    key={p}
                    className="panel-picker-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddPanel(p);
                      setShowPicker(false);
                    }}
                  >
                    <span className="panel-picker-key">{PANEL_META[p].fnKey}</span>
                    <span>{PANEL_META[p].label}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tab-bar ${dragOverColumn ? "drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverColumn(true); }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOverColumn(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverColumn(false);
        onDropOnColumn(columnId);
      }}
    >
      {panels.map((panelId, index) => {
        const meta = PANEL_META[panelId];
        const isActive = index === activeIndex;
        return (
          <div
            key={`${panelId}-${index}`}
            className={`tab-item ${isActive ? "active" : ""} ${dragOverTab === index ? "drag-over-tab" : ""}`}
            draggable
            onDragStart={(e) => {
              const data: DragData = { panelId, fromColumnId: columnId, fromIndex: index };
              dragDataRef.current = data;
              onDragStart(data);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", JSON.stringify(data));
            }}
            onDragEnd={() => {
              dragDataRef.current = null;
              setDragOverTab(null);
              onDragEnd();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverTab(index);
            }}
            onDragLeave={() => setDragOverTab(null)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverTab(null);
              setDragOverColumn(false);
              onDropOnTab(columnId, index);
            }}
            onClick={() => onSelect(index)}
          >
            <span className="tab-label">{meta.label}</span>
            {meta.closable && panels.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(index);
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {/* Add panel button */}
      <div className="tab-bar-actions" ref={pickerRef}>
        <button
          className="tab-add-btn"
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          title="Add panel"
        >+
        </button>
        {showPicker && (
          <div className="panel-picker-dropdown">
            {availablePanels.length === 0 ? (
              <div className="panel-picker-empty">All panels in use</div>
            ) : (
              availablePanels.map((p) => (
                <button
                  key={p}
                  className="panel-picker-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPanel(p);
                    setShowPicker(false);
                  }}
                >
                  <span className="panel-picker-key">{PANEL_META[p].fnKey}</span>
                  <span>{PANEL_META[p].label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
