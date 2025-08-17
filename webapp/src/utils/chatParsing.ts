export type ToolEventStatus = 'success' | 'failure' | 'info';

export interface ToolEventItem {
  id: string;
  toolName: string;
  status: ToolEventStatus;
  details?: string;
}

export interface AgentInsightsResult {
  thoughts: string[];
  toolEvents: ToolEventItem[];
  remainingContent: string;
}

/**
 * Parse an LLM message content into thoughts, tool events and the final cleaned text.
 * It expects thoughts to start with "I detected" and tool results to be prefixed by
 * "Tool execution results:" followed by lines beginning with ✅/❌. Lines beginning with
 * "Message:" or "Data:" are appended to the current tool event details.
 */
export function extractAgentInsights(content: string, messageId: string): AgentInsightsResult {
  let remaining = content;
  const thoughts: string[] = [];
  const events: ToolEventItem[] = [];

  // Parse tool execution results first using a clear marker and end boundary (blank line or end)
  const marker = 'Tool execution results:';
  const markerIdx = remaining.indexOf(marker);
  if (markerIdx !== -1) {
    const head = remaining.slice(0, markerIdx);
    const tail = remaining.slice(markerIdx + marker.length);
    const endIdxInTail = tail.indexOf('\n\n');
    const section = tail.slice(0, endIdxInTail === -1 ? undefined : endIdxInTail);
    const after = tail.slice(endIdxInTail === -1 ? section.length : endIdxInTail);

    let current: ToolEventItem | null = null;
    for (const raw of section.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('✅ ') || line.startsWith('❌ ')) {
        if (current) events.push(current);
        const ok = line.startsWith('✅ ');
        const afterIcon = line.slice(2).trim();
        // Handle both formats: "Tool: details" and "Tool: Error - details"
        const colonIndex = afterIcon.indexOf(':');
        if (colonIndex !== -1) {
          const toolName = afterIcon.slice(0, colonIndex).trim();
          const details = afterIcon.slice(colonIndex + 1).trim();
          current = {
            id: `${messageId}-${events.length}`,
            toolName: toolName || 'Tool',
            status: ok ? 'success' : 'failure',
            details: details,
          };
        } else {
          // Fallback if no colon found
          current = {
            id: `${messageId}-${events.length}`,
            toolName: afterIcon || 'Tool',
            status: ok ? 'success' : 'failure',
            details: '',
          };
        }
      } else if (current && (line.startsWith('Message:') || line.startsWith('Data:'))) {
        const extra = line.replace(/^\w+:/, '').trim();
        current.details = `${current.details ? current.details + '\n' : ''}${extra}`;
      }
    }
    if (current) events.push(current);

    remaining = (head + after).trim();
  }

  // Extract thoughts section starting from "I detected" until a blank line
  const thoughtsIdx = remaining.indexOf('I detected');
  if (thoughtsIdx !== -1) {
    const tail = remaining.slice(thoughtsIdx);
    const endIdx = tail.indexOf('\n\n') !== -1 ? thoughtsIdx + tail.indexOf('\n\n') : remaining.length;
    const section = remaining.slice(thoughtsIdx, endIdx);
    section
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .forEach(l => thoughts.push(l));
    remaining = (remaining.slice(0, thoughtsIdx) + remaining.slice(endIdx)).trim();
  }

  return { thoughts, toolEvents: events, remainingContent: remaining.trim() };
}
