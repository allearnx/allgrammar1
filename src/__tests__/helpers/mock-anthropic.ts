import { vi } from 'vitest';

interface GradeResult {
  index: number;
  score: number;
  feedback: string;
}

/**
 * Mock Anthropic SDK for AI grading routes.
 * Call this before `vi.resetModules()` + dynamic import.
 */
export function mockAnthropicGrade(results: GradeResult[]) {
  const responseText = JSON.stringify(results);

  vi.mock('@anthropic-ai/sdk', () => ({
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: responseText }],
        }),
      };
    },
  }));
}

/**
 * Mock Anthropic SDK that returns a free-form chat response.
 */
export function mockAnthropicChat(response: string) {
  vi.mock('@anthropic-ai/sdk', () => ({
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: response }],
        }),
      };
    },
  }));
}

/**
 * Mock Anthropic SDK that throws an error.
 */
export function mockAnthropicError(message = 'API error') {
  vi.mock('@anthropic-ai/sdk', () => ({
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockRejectedValue(new Error(message)),
      };
    },
  }));
}
