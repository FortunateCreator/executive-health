export const aiConfig = {
  provider: 'deepseek' as const,
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-v4-flash',
  timeoutMs: 30000,
  fallbackToHeuristic: true,
};
