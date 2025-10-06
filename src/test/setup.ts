import { jest } from "@jest/globals";
process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "test_secret_key_minimum_32_characters";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.SMTP_HOST = process.env.SMTP_HOST || "localhost";
process.env.SMTP_PORT = process.env.SMTP_PORT || "587";
process.env.SMTP_USER = process.env.SMTP_USER || "test";
process.env.SMTP_PASS = process.env.SMTP_PASS || "test";

globalThis.Bun = {
  env: process.env,
} as any;

jest.mock("@/database/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

console.log = jest.fn();
console.error = jest.fn();
