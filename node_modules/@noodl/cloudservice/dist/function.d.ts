import { CFVersion } from './function-deploy';
import { Logger } from './logger';
export declare class FunctionLogger {
    noodlParseServer: any;
    constructor(noodlParseServer: any);
    log(level: any, message: any): void;
}
export type ExecuteFunctionOptions = {
    port: number;
    appId: string;
    masterKey: string;
    version: CFVersion;
    logger: Logger;
    headers: Record<string, unknown>;
    functionId: string;
    body: string;
    timeOut: number;
    memoryLimit: number;
};
export declare function executeFunction({ port, appId, masterKey, version, logger, headers, functionId, body, timeOut, memoryLimit }: ExecuteFunctionOptions): Promise<import("./context/createContext").HandleRequestResult>;
