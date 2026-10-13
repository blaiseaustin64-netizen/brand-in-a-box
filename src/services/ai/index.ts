export {
  getAIProvider,
  setAIProvider,
  useMockAIProvider,
} from './provider';
export type { AIProvider, AIGenerateRequest, AIGenerateResponse } from './provider';
export { MockAIProvider } from './mockProvider';
export { RemoteAIProvider } from './remoteProvider';
export { fetchAiHealth, AI_ENDPOINTS, DOCUMENTED_DEFAULTS } from './config';
export type { AiHealthStatus } from './config';
export * from './capabilityStatus';
