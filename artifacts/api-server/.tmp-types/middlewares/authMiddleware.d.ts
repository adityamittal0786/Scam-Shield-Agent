import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
declare global {
    namespace Express {
        interface User extends AuthUser {
        }
        interface Request {
            isAuthenticated(): this is AuthedRequest;
            user?: User | undefined;
        }
        interface AuthedRequest {
            user: User;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
