import "server-only";

import { GeminiAIProvider } from "@/lib/ai/gemini";
import type { AIProvider } from "@/lib/ai/types";

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  provider ??= new GeminiAIProvider();
  return provider;
}
