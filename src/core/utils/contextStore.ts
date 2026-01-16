import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  instituteId: string;
  userId?: string;
  role?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export const getContext = () => contextStorage.getStore();
export const getInstituteId = () => contextStorage.getStore()?.instituteId;
export const getUserId = () => contextStorage.getStore()?.userId;
