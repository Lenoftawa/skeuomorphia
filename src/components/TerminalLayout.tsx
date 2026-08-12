"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";
import { DraggableTabBar } from "./DraggableTabBar";
import { DEFAULT_LAYOUT } from "@/lib/panels";
import type { TerminalLayoutState, LayoutColumn, PanelId, DragData, PanelType } from "@/lib/types";

const STORAGE_KEY = "flare-terminal-layout";

function loadLayout(): TerminalLayoutState {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_LAYOUT;
}

interface TerminalLayoutContextValue {
  addPanelToLayout: (panelId: PanelId) => void;
  focusPanel: (panelId: PanelId) => void;
  resetLayout: () => void;
  addColumn: () => void;
}

const TerminalLayoutContext = createContext<TerminalLayoutContextValue | null>(null);

export function useTerminalLayout() {
  const ctx = useContext(TerminalLayoutContext);
  if (!ctx) throw new Error("useTerminalLayout must be used within TerminalLayout");
  return ctx;
}

interface TerminalLayoutProps {
  renderPanel: (panelId: PanelId) => ReactNode;
  footer?: ReactNode;
  onActivePanelChange?: (panelId: PanelType) => void;
}

export function TerminalLayout({ renderPanel, footer, onActivePanelChange }: TerminalLayoutProps) {
  const [layout, setLayout] = useState<TerminalLayoutState>(DEFAULT_LAYOUT);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLayout(loadLayout());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {}
  }, [layout, loaded]);

  const activePanelId = layout.columns[1]?.panels[layout.columns[1]?.activeIndex] ?? "atm";
  useEffect(() => {
    onActivePanelChange?.(activePanelId as PanelType);
  }, [activePanelId, onActivePanelChange]);

  const updateColumn = useCallback((columnId: string, updater: (col: LayoutColumn) => LayoutColumn) => {
    setLayout((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => (col.id === columnId ? updater(col) : col)),
    }));
  }, []);

  const handleSelect = useCallback((columnId: string, index: number) => {
    updateColumn(columnId, (col) => ({ ...col, activeIndex: index }));
  }, [updateColumn]);

  const handleClose = useCallback((columnId: string, index: number) => {
    updateColumn(columnId, (col) => {
      const panels = col.panels.filter((_, i) => i !== index);
      const activeIndex = Math.min(col.activeIndex, panels.length - 1);
      return { ...col, panels, activeIndex: Math.max(0, activeIndex) };
    });
  }, [updateColumn]);

  const handleDragStart = useCallback((data: DragData) => {
    setDragData(data);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragData(null);
  }, []);

  const handleDropOnTab = useCallback((toColumnId: string, toTabIndex: number) => {
    if (!dragData) return;
    const { panelId, fromColumnId, fromIndex } = dragData;

    setLayout((prev) => {
      const columns = prev.columns.map((c) => ({ ...c, panels: [...c.panels] }));

      if (fromColumnId === toColumnId) {
        const col = columns.find((c) => c.id === toColumnId);
        if (!col) return prev;
        col.panels.splice(fromIndex, 1);
        const insertAt = fromIndex < toTabIndex ? toTabIndex - 1 : toTabIndex;
        col.panels.splice(insertAt, 0, panelId);
        col.activeIndex = insertAt;
        return { ...prev, columns };
      }

      const fromCol = columns.find((c) => c.id === fromColumnId);
      const toCol = columns.find((c) => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;

      fromCol.panels.splice(fromIndex, 1);
      if (fromCol.activeIndex >= fromCol.panels.length) {
        fromCol.activeIndex = Math.max(0, fromCol.panels.length - 1);
      }

      toCol.panels.splice(toTabIndex, 0, panelId);
      toCol.activeIndex = toTabIndex;

      return { ...prev, columns };
    });

    setDragData(null);
  }, [dragData]);

  const handleDropOnColumn = useCallback((toColumnId: string) => {
    if (!dragData) return;
    const { panelId, fromColumnId, fromIndex } = dragData;

    setLayout((prev) => {
      const columns = prev.columns.map((c) => ({ ...c, panels: [...c.panels] }));

      if (fromColumnId === toColumnId) return prev;

      const fromCol = columns.find((c) => c.id === fromColumnId);
      const toCol = columns.find((c) => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;

      fromCol.panels.splice(fromIndex, 1);
      if (fromCol.activeIndex >= fromCol.panels.length) {
        fromCol.activeIndex = Math.max(0, fromCol.panels.length - 1);
      }

      const isCommand = panelId === "command";
      if (isCommand && toCol.panels.length > 0) {
        toCol.panels.push(panelId);
        toCol.activeIndex = toCol.panels.length - 1;
      } else {
        toCol.panels.push(panelId);
        toCol.activeIndex = toCol.panels.length - 1;
      }

      return { ...prev, columns };
    });

    setDragData(null);
  }, [dragData]);

  const addPanelToLayout = useCallback((panelId: PanelId) => {
    setLayout((prev) => {
      for (const col of prev.columns) {
        if (col.panels.includes(panelId)) {
          updateColumn(col.id, (c) => ({ ...c, activeIndex: c.panels.indexOf(panelId) }));
          return prev;
        }
      }
      const columns = prev.columns.map((c) => ({ ...c, panels: [...c.panels] }));
      const centerCol = columns[1];
      centerCol.panels.push(panelId);
      centerCol.activeIndex = centerCol.panels.length - 1;
      return { ...prev, columns };
    });
  }, [updateColumn]);

  const focusPanel = useCallback((panelId: PanelId) => {
    const existingColumn = layout.columns.find((col) => col.panels.includes(panelId));
    const targetColumnId = existingColumn?.id ?? layout.columns[1]?.id ?? layout.columns[0]?.id;

    setLayout((prev) => {
      const columns = prev.columns.map((c) => ({ ...c, panels: [...c.panels] }));
      for (const col of columns) {
        const idx = col.panels.indexOf(panelId);
        if (idx >= 0) {
          col.activeIndex = idx;
          return { ...prev, columns };
        }
      }
      const centerCol = columns[1] ?? columns[0];
      if (!centerCol.panels.includes(panelId)) {
        centerCol.panels.push(panelId);
      }
      centerCol.activeIndex = centerCol.panels.indexOf(panelId);
      return { ...prev, columns };
    });

    if (targetColumnId && window.matchMedia("(max-width: 768px)").matches) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-column-id="${targetColumnId}"]`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      });
    }
  }, [layout.columns]);

  const addColumn = useCallback(() => {
    setLayout((prev) => {
      const columns = [...prev.columns];
      if (columns.length >= 5) return prev;
      const newCol: LayoutColumn = {
        id: `col-${Date.now()}`,
        panels: [],
        activeIndex: 0,
      };
      columns.push(newCol);
      return { ...prev, columns };
    });
  }, []);

  const closeColumn = useCallback((columnId: string) => {
    setLayout((prev) => {
      if (prev.columns.length <= 1) return prev;
      const columns = prev.columns.filter((c) => c.id !== columnId);
      return { ...prev, columns };
    });
  }, []);

  const addPanelToColumn = useCallback((columnId: string, panelId: PanelId) => {
    setLayout((prev) => {
      const columns = prev.columns.map((c) => ({ ...c, panels: [...c.panels] }));
      for (const col of columns) {
        if (col.panels.includes(panelId)) {
          col.activeIndex = col.panels.indexOf(panelId);
          return { ...prev, columns };
        }
      }
      const col = columns.find((c) => c.id === columnId);
      if (col) {
        col.panels.push(panelId);
        col.activeIndex = col.panels.length - 1;
      }
      return { ...prev, columns };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const getColFlex = (count: number, idx: number) => {
    if (count === 1) return "flex-[1]";
    if (count === 2) return "flex-[1]";
    if (count === 3) return idx === 1 ? "flex-[2]" : "flex-[1]";
    return "flex-[1]";
  };

  return (
    <TerminalLayoutContext.Provider value={{ addPanelToLayout, focusPanel, resetLayout, addColumn }}>
      {footer}
      <div className="terminal-layout min-h-0 flex-1 flex gap-1.5 p-1.5 overflow-hidden">
        {layout.columns.map((col, colIdx) => {
          const activePanel = col.panels[col.activeIndex];
          const isCommandCol = col.panels.includes("command") && col.panels.length === 2;
          const colFlex = getColFlex(layout.columns.length, colIdx);
          const canCloseCol = layout.columns.length > 1;

          if (col.panels.length === 0) {
            return (
              <div key={col.id} data-column-id={col.id} className={`terminal-column min-w-0 ${colFlex} flex flex-col`}>
                <DraggableTabBar
                  columnId={col.id}
                  panels={[]}
                  activeIndex={0}
                  canCloseColumn={canCloseCol}
                  onSelect={() => {}}
                  onClose={() => {}}
                  onAddPanel={(p) => addPanelToColumn(col.id, p)}
                  onCloseColumn={() => closeColumn(col.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDropOnTab={handleDropOnTab}
                  onDropOnColumn={handleDropOnColumn}
                />
                <div className="flex-1 border border-dashed border-terminal-border/30 flex items-center justify-center">
                  <span className="text-terminal-white-dim text-[10px]">EMPTY COLUMN</span>
                </div>
              </div>
            );
          }

          if (isCommandCol) {
            const commandIdx = col.panels.indexOf("command");
            const otherIdx = commandIdx === 0 ? 1 : 0;
            const otherPanel = col.panels[otherIdx];
            const activeIsCommand = col.activeIndex === commandIdx;

            return (
              <div key={col.id} data-column-id={col.id} className={`terminal-column min-w-0 ${colFlex} overflow-hidden flex flex-col gap-1`}>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <DraggableTabBar
                    columnId={col.id}
                    panels={[otherPanel]}
                    activeIndex={0}
                    canCloseColumn={canCloseCol}
                    onSelect={() => handleSelect(col.id, otherIdx)}
                    onClose={() => handleClose(col.id, otherIdx)}
                    onAddPanel={(p) => addPanelToColumn(col.id, p)}
                    onCloseColumn={() => closeColumn(col.id)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropOnTab={handleDropOnTab}
                    onDropOnColumn={handleDropOnColumn}
                  />
                  <div className="flex-1 overflow-hidden">
                    {!activeIsCommand ? renderPanel(otherPanel) : null}
                  </div>
                </div>
                <div className="h-56 overflow-hidden flex flex-col">
                  <DraggableTabBar
                    columnId={col.id + "-cmd"}
                    panels={["command"]}
                    activeIndex={0}
                    canCloseColumn={false}
                    onSelect={() => handleSelect(col.id, commandIdx)}
                    onClose={() => {}}
                    onAddPanel={() => {}}
                    onCloseColumn={() => {}}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropOnTab={handleDropOnTab}
                    onDropOnColumn={handleDropOnColumn}
                  />
                  <div className="flex-1 overflow-hidden">
                    {renderPanel("command")}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={col.id} data-column-id={col.id} className={`terminal-column min-w-0 ${colFlex} overflow-hidden flex flex-col`}>
              <DraggableTabBar
                columnId={col.id}
                panels={col.panels}
                activeIndex={col.activeIndex}
                canCloseColumn={canCloseCol}
                onSelect={(i) => handleSelect(col.id, i)}
                onClose={(i) => handleClose(col.id, i)}
                onAddPanel={(p) => addPanelToColumn(col.id, p)}
                onCloseColumn={() => closeColumn(col.id)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDropOnTab={handleDropOnTab}
                onDropOnColumn={handleDropOnColumn}
              />
              <div className="flex-1 overflow-hidden">
                {activePanel && renderPanel(activePanel)}
              </div>
            </div>
          );
        })}
        {layout.columns.length < 5 && (
          <button
            className="add-column-btn"
            onClick={addColumn}
            title="Add column"
          >
            <span aria-hidden="true">+</span><span>COL</span>
          </button>
        )}
      </div>
    </TerminalLayoutContext.Provider>
  );
}
