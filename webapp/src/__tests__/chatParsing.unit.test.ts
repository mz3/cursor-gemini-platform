import { extractAgentInsights } from '../utils/chatParsing';

describe('extractAgentInsights', () => {
  it('parses thoughts, tool events and remaining content from an LLM response', () => {
    const message = [
      'I detected 1 tool(s) that I can use to help you:',
      '- Platform API SDK: Comprehensive API SDK for accessing all platform features - models, applications, bots, prompts, tools, etc.',
      '',
      'Tool execution results:',
      '✅ Platform API SDK: Successfully executed',
      'Message: Fetched features',
      'Data: {"id":"abc","name":"Deployment"}',
      '',
      'Certainly! Here are the features available on your Meta Platform account:',
      '- Deployment (active)',
      '- Docker Building (active)'
    ].join('\n');

    const { thoughts, toolEvents, remainingContent } = extractAgentInsights(message, 'msg-1');

    // Thoughts
    expect(thoughts.length).toBeGreaterThan(0);
    expect(thoughts[0].startsWith('I detected 1 tool')).toBe(true);

    // Tool events
    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].toolName).toBe('Platform API SDK');
    expect(toolEvents[0].status).toBe('success');
    expect(toolEvents[0].details).toContain('Fetched features');
    expect(toolEvents[0].details).toContain('{"id":"abc"');

    // Remaining content should not contain the preface sections
    expect(remainingContent).toContain('Certainly! Here are the features');
    expect(remainingContent).not.toContain('I detected 1 tool');
    expect(remainingContent).not.toContain('Tool execution results:');
  });

  it('handles responses without tools gracefully', () => {
    const message = 'Hello\n\nThis is a plain response without tools.';
    const { thoughts, toolEvents, remainingContent } = extractAgentInsights(message, 'msg-2');
    expect(thoughts).toEqual([]);
    expect(toolEvents).toEqual([]);
    expect(remainingContent).toBe('Hello\n\nThis is a plain response without tools.');
  });
});
