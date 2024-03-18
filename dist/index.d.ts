import type { Request, Response, NextFunction } from "express";
import { NoodlParseServerOptions, NoodlParseServerResult } from "./parse";
export declare function createNoodlServer(options: NoodlParseServerOptions): {
    noodlServer: NoodlParseServerResult;
    middleware: (req: Request, res: Response, next: NextFunction) => void;
};
