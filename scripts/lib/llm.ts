/**
 * Minimal OpenAI-compatible chat client for the résumé judge.
 * Uses fetch only — no SDK dependency. Works with OpenAI, OpenRouter,
 * Groq, Azure OpenAI (chat completions path), and local proxies.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface LlmClient {
  complete(request: ChatCompletionRequest): Promise<string>;
}

export interface OpenAiCompatibleConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export function resolveJudgeModel(explicit?: string): string {
  return (
    explicit ??
    process.env.RESUME_JUDGE_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_MODEL
  );
}

export function resolveJudgeApiKey(): string | undefined {
  return (
    process.env.RESUME_JUDGE_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.OPENROUTER_API_KEY
  );
}

export function resolveJudgeBaseUrl(): string {
  return (
    process.env.RESUME_JUDGE_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
}

export class OpenAiCompatibleClient implements LlmClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: OpenAiCompatibleConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async complete(request: ChatCompletionRequest): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        response_format: request.response_format,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LLM request failed (${response.status} ${response.statusText}): ${body.slice(0, 500)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("LLM response did not include message content");
    }
    return content;
  }
}

export function createJudgeLlmClient(options?: {
  apiKey?: string;
  baseUrl?: string;
}): LlmClient {
  const apiKey = options?.apiKey ?? resolveJudgeApiKey();
  if (!apiKey) {
    throw new Error(
      "No LLM API key found. Set RESUME_JUDGE_API_KEY or OPENAI_API_KEY (OpenAI-compatible).",
    );
  }
  return new OpenAiCompatibleClient({
    apiKey,
    baseUrl: options?.baseUrl ?? resolveJudgeBaseUrl(),
  });
}
