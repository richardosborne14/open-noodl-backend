import ivm from "isolated-vm";
import { Logger } from "../logger";
export interface ContextGlobalState {
    cache: Record<string, ReturnType<typeof createContext>>;
}
export interface CreateContextEnv {
    /**
     * The version is used to query the database for the Cloud Functions.
     *
     * Query: '/classes/Ndl_CF?where={"version":"${env.version}"}'
     */
    version: string;
    /**
     * Timeout if no reply from function.
     * Recommend: 15
     */
    functionTimeout: number;
    /**
     * The timeout time to initialize a new isolate in seconds.
     * Recommend: 15
     */
    initializeTimeout: number;
    memoryLimit: number;
    backendEndpoint: string;
    appId: string;
    masterKey: string;
    logger: Logger;
}
interface ContextState {
    global: ContextGlobalState;
    env: CreateContextEnv;
    context: ivm.Context;
    isolate: ivm.Isolate;
    markedToBeDiscarded: boolean;
    ttl: number;
    responseHandlers: Record<string, (req: unknown) => void>;
}
export interface HandleRequestOptions {
    functionId: string;
    headers: Record<string, unknown>;
    body: unknown;
}
export type HandleRequestResult = {
    headers?: Record<string, unknown>;
    statusCode: number;
    body: string;
};
/**
 * Create an isolated context for a specific environment
 * @param env
 * @returns
 */
export declare function createContext(global: ContextGlobalState, env: CreateContextEnv): Promise<{
    state: ContextState;
    eval: (script: string) => Promise<void>;
    handleRequest: (options: HandleRequestOptions) => Promise<HandleRequestResult>;
}>;
export {};
