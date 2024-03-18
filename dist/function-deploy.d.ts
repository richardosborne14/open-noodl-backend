export type GetLatestVersionOptions = {
    appId: string;
    masterKey: string;
    port: number;
};
export type CFVersion = {
    functionVersion: string;
};
export declare function getLatestVersion(options: GetLatestVersionOptions): Promise<CFVersion>;
export declare function deployFunctions({ port, appId, masterKey, runtime, data }: {
    port: any;
    appId: any;
    masterKey: any;
    runtime: any;
    data: any;
}): Promise<{
    version: string;
}>;
