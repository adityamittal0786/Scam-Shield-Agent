import * as client from "openid-client";
import { type Request, type Response } from "express";
import type { AuthUser } from "@workspace/api-zod";
export declare const ISSUER_URL: string;
export declare const SESSION_COOKIE = "sid";
export declare const SESSION_TTL: number;
export interface SessionData {
    user: AuthUser;
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
}
export declare function getOidcConfig(): Promise<client.Configuration>;
export declare function createSession(data: SessionData): Promise<string>;
export declare function getSession(sid: string): Promise<SessionData | null>;
export declare function updateSession(sid: string, data: SessionData): Promise<void>;
export declare function deleteSession(sid: string): Promise<void>;
export declare function clearSession(res: Response, sid?: string): Promise<void>;
export declare function getSessionId(req: Request): string | undefined;
