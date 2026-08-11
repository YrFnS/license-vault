/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import middleware from "./middleware";

const request = (path: string, method: string, ip: string) =>
	new NextRequest(`https://license-vault.test${path}`, {
		method,
		headers: { "x-forwarded-for": ip },
	});

describe("auth rate limiting", () => {
	test("session reads do not consume the login-attempt quota", async () => {
		const statuses: number[] = [];
		for (let attempt = 0; attempt < 11; attempt += 1) {
			statuses.push((await middleware(request("/api/auth/session", "GET", "198.51.100.10"))).status);
		}
		expect(statuses).not.toContain(429);
	});

	test("authentication mutations retain the strict quota", async () => {
		const statuses: number[] = [];
		for (let attempt = 0; attempt < 11; attempt += 1) {
			statuses.push((await middleware(request("/api/auth/callback/credentials", "POST", "198.51.100.11"))).status);
		}
		expect(statuses.at(-1)).toBe(429);
	});
});