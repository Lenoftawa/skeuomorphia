"use client";

import { useState, useRef, useEffect } from "react";

interface CommandLineProps {
  onCommand: (cmd: string) => string;
}

export function CommandLine({ onCommand }: CommandLineProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ cmd: string; output: string }[]>([
    { cmd: "HELP", output: "AVAILABLE: HELP, CONNECT, ATM, TRADE, MARKET, PORTFOLIO, CLEAR, ABOUT" },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const output = onCommand(input.toUpperCase().trim());
    setHistory((prev) => [...prev, { cmd: input, output }]);
    setInput("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
      if (history[history.length - 1 - newIndex]) {
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex].cmd);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex].cmd);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="terminal-panel terminal-panel-grad h-full flex flex-col">
      <div className="terminal-header">
        <span>COMMAND LINE</span>
        <span className="text-[10px] text-terminal-green flex items-center">
          <span className="status-led led-green" />READY
        </span>
      </div>
      <div ref={logRef} className="terminal-content flex-1 overflow-auto text-[11px]">
        {history.map((entry, i) => (
          <div key={i} className="mb-1.5 animate-fade-in">
            <div className="text-terminal-amber">
              <span className="text-terminal-green glow-green">flare-t&gt;</span> {entry.cmd}
            </div>
            <div className="text-terminal-white pl-4 whitespace-pre-wrap">{entry.output}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center border-t border-terminal-border p-1.5 bg-terminal-panel-dark">
        <span className="text-terminal-green glow-green text-xs px-1.5">◈</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-terminal-amber text-xs focus:outline-none placeholder:text-terminal-white-faint"
          placeholder="ENTER COMMAND... (try HELP)"
        />
        <span className="text-terminal-amber animate-blink ml-1">_</span>
      </form>
    </div>
  );
}
