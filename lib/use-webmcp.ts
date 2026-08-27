'use client';

import { useEffect, useRef, useState } from 'react';
import { createRelayTools, type ToolDefinition } from './relay-tools';
import type { RelayState } from './relay';

type ModelContext = {
  registerTool: (tool: ToolDefinition) => Promise<void> | void;
  unregisterTool?: (name: string) => Promise<void> | void;
};
declare global { interface Document { modelContext?: ModelContext; } }

export function useWebMCP(state: RelayState, onApprovalRequested: () => void, onCommit: () => void) {
  const stateRef = useRef(state);
  const callbacksRef = useRef({ onApprovalRequested, onCommit });
  const [registeredCount, setRegisteredCount] = useState(0);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { callbacksRef.current = { onApprovalRequested, onCommit }; }, [onApprovalRequested, onCommit]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = createRelayTools({
      getState: () => stateRef.current,
      onApprovalRequested: () => callbacksRef.current.onApprovalRequested(),
      onCommit: () => callbacksRef.current.onCommit(),
    });
    let cancelled = false;
    Promise.all(tools.map((tool) => Promise.resolve(context.registerTool(tool))))
      .then(() => { if (!cancelled) setRegisteredCount(tools.length); })
      .catch(() => { if (!cancelled) setRegisteredCount(0); });
    return () => {
      cancelled = true;
      if (context.unregisterTool) tools.forEach((tool) => void context.unregisterTool?.(tool.name));
    };
  }, []);
  return { supported: registeredCount > 0, registeredCount };
}
