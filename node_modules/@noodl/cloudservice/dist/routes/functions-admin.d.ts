import type { Request, Response, NextFunction } from "express";
import { NoodlParseServerResult } from "../parse";
export declare function routeFunctionsAdmin(noodlServer: NoodlParseServerResult, req: Request, res: Response, _next: NextFunction): Promise<Response<any, Record<string, any>>>;
