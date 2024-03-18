import type { Request, Response, NextFunction } from "express";
import { NoodlParseServerResult } from "../parse";
export declare function routeFunctions(noodlServer: NoodlParseServerResult, req: Request, res: Response, next: NextFunction): Promise<void>;
