import request from "@/utils/request";

export const CET_QUESTION_API = "/v1/cet-questions";

export interface CetAiSettings {
  apiKeyConfigured: boolean;
  encryptionReady: boolean;
  useGeneratedReference: boolean;
  rewriteModel: string;
  gradingModel: string;
  models: { id: string; name: string }[];
}

export interface CetRewritePrompt {
  prompt: string;
  batchSize: number;
}

export type CetAiPromptType = "grading" | "rewrite";

export interface CetAiPrompt {
  prompt: string;
  defaultPrompt: string;
  maxLength: number;
}

export function getCetAiSettings() {
  return request.get<unknown, CetAiSettings>(CET_QUESTION_API + "/ai-settings");
}

export function getCetRewritePrompt() {
  return request.get<unknown, CetRewritePrompt>(CET_QUESTION_API + "/rewrite-prompt");
}

export function getCetAiPrompt(type: CetAiPromptType) {
  return request.get<unknown, CetAiPrompt>(`${CET_QUESTION_API}/ai-prompts/${type}`);
}

export function updateCetAiPrompt(type: CetAiPromptType, prompt: string) {
  return request.put<unknown, CetAiPrompt>(`${CET_QUESTION_API}/ai-prompts/${type}`, { prompt });
}
