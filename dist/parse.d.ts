import ParseServer from 'parse-server';
import { LoggerAdapter } from './mongodb';
export type NoodlParseServerOptions = {
    port: number;
    databaseURI: string;
    masterKey: string;
    appId: string;
    parseOptions?: Record<string, unknown>;
    functionOptions: {
        timeOut: number;
        memoryLimit: number;
    };
};
export type NoodlParseServerResult = {
    functionOptions: NoodlParseServerOptions['functionOptions'];
    options: {
        port: number;
        appId: string;
        masterKey: string;
    };
    server: ParseServer;
    logger: LoggerAdapter;
};
export declare function createNoodlParseServer({ port, databaseURI, masterKey, appId, functionOptions, parseOptions, }: NoodlParseServerOptions): NoodlParseServerResult;
