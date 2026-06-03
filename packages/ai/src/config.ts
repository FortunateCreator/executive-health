export const aiConfig = {
  provider: 'deepseek' as const,
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  timeoutMs: 15000,
  fallbackToHeuristic: true,
};
