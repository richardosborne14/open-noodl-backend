import { createContext } from "./context/createContext";
import { Logger } from "./logger";
import { CFVersion } from "./function-deploy";
export type GetCachedContextOptions = {
    backendEndpoint: string;
    appId: string;
    masterKey: string;
    version: CFVersion;
    logger: Logger;
    timeout: number | undefined;
    memoryLimit: number | undefined;
};
export declare function getCachedContext(options: GetCachedContextOptions): ReturnType<typeof createContext>;
export declare function scheduleContextCachePurge(): void;
