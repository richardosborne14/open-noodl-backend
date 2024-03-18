import Winston from 'winston';
export declare class LoggerAdapter {
    logger: Winston.Logger;
    constructor(options: any);
    log(): void;
    _log(): any;
    query(options: any, callback?: (_result: any) => void): Promise<unknown>;
}
