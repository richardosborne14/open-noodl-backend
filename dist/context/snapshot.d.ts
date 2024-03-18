import ivm from "isolated-vm";
export declare function getRuntimeSnapshot(functionRuntimeVersion: string): Promise<ivm.ExternalCopy<ArrayBuffer>>;
