import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel checkout cleanup schedule", () => {
  it("schedules checkout cleanup once daily for Hobby-compatible Vercel cron limits", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as {
      crons?: Array<{ path: string; schedule: string }>;
    };

    expect(config.crons).toContainEqual({
      path: "/api/cron/cleanup-sessions",
      schedule: "0 1 * * *",
    });
  });
});
