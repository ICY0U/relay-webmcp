'use client';

import { useEffect, useRef, useState } from 'react';
import { createRelayTools, type ToolDefinition } from './relay-tools';
import type { InternetCommitRequest, RelayState } from './relay';

type ModelContext = {
  registerTool: (tool: ToolDefinition) => Promise<void> | void;
  unregisterTool?: (name: string) => Promise<void> | void;
};

type WebMCPCallbacks = {
  onApprovalRequired: () => void;
  onApprovalRequested: () => void;
  onBeginService: (serviceId: string) => void;
  onCompleteService: (serviceId: string) => void;
  onCommit: (request: InternetCommitRequest) => void;
  onRunMission: () => Promise<void>;
};

declare global { interface Document { modelContext?: ModelContext; } }

export function useWebMCP(state: RelayState, callbacks: WebMCPCallbacks) {
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const [registeredCount, setRegisteredCount] = useState(0);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = createRelayTools({
      getState: () => stateRef.current,
      onApprovalRequired: () => callbacksRef.current.onApprovalRequired(),
      onApprovalRequested: () => callbacksRef.current.onApprovalRequested(),
      onBeginService: (serviceId) => callbacksRef.current.onBeginService(serviceId),
      onCompleteService: (serviceId) => callbacksRef.current.onCompleteService(serviceId),
      onCommit: (request) => callbacksRef.current.onCommit(request),
      onRunMission: () => callbacksRef.current.onRunMission(),
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
