import vm from "node:vm";

export interface SandboxResult {
    success: boolean;
    logs: string[];
    error: string | null;
    errorType: string | null;
    stackTrace: string | null;
    executionTimeMs: number;
}

export function executeInSandbox(
    code: string,
    timeoutMs: number = 1000
): SandboxResult {
    const logs: string[] = [];
    const startTime = Date.now();

    const sandboxContext = {
        console: {
            log: (...args: any[]) => {
                logs.push(args.map((arg) => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(" "));
            },
            error: (...args: any[]) => {
                logs.push(`[ERROR] ${args.join(" ")}`);
            }
        },
        Math,
        Date,
        JSON,
        setTimeout,
        clearTimeout,

        assert: {
            equal: (actual: any, expected: any, message?: string) => {
                if (actual !== expected) {
                    throw new Error(
                        message || `Assertion Failed: expected [${expected}], but got [${actual}]`
                    );
                }
            },
            ok: (value: any, message?: string) => {
                if (!value) {
                    throw new Error(message || `Assertion Failed: expected value to be truthy`);
                }
            }
        }
    };

    try {
        const context = vm.createContext(sandboxContext);

        vm.runInContext(code, context, {
            timeout: timeoutMs,
            displayErrors: true,
        }); 

        const executionTimeMs = Date.now() - startTime;

        return {
            success: true,
            logs,
            error: null,
            errorType: null,
            stackTrace: null,
            executionTimeMs
        };
    } catch (err: any) {
        const executionTimeMs = Date.now() - startTime;

        const errorType = err.name || "Error";
        const errorMessage = err.message || String(err);
        const stackTrace = err.stack || null;

        return {
            success: false,
            logs,
            error: errorMessage,
            errorType,
            stackTrace,
            executionTimeMs,
        };
    }
}