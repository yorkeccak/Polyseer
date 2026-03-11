import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();

/** Full-size reasoning model — used for planning, critiquing, main research */
export const getLargeModel = (): LanguageModel => {
  if (provider === 'anthropic') return anthropic('claude-sonnet-4-6') as unknown as LanguageModel;
  return openai('gpt-4o') as unknown as LanguageModel;
};

/** Fast/cheap model — used for summarization, structured extraction, light tasks */
export const getSmallModel = (): LanguageModel => {
  if (provider === 'anthropic') return anthropic('claude-haiku-4-5-20251001') as unknown as LanguageModel;
  return openai('gpt-4o-mini') as unknown as LanguageModel;
};

/** Most capable model — used for high-stakes analysis (niche authority, etc.) */
export const getPowerModel = (): LanguageModel => {
  if (provider === 'anthropic') return anthropic('claude-opus-4-6') as unknown as LanguageModel;
  return openai('gpt-5') as unknown as LanguageModel;
};
