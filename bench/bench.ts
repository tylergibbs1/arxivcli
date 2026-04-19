#!/usr/bin/env bun
// Benchmark: run a fixed set of deterministic CLI invocations, validate correctness,
// report total stdout bytes on one line like `METRICS bytes=NNN cases_ok=M/N`.
// Optimization target: minimize bytes under a passing correctness gate.

import { spawnSync } from "node:child_process";

type Case = {
  name: string;
  argv: string[];
  expect_ok: boolean;
  expect_code?: string;           // when !ok, must match this code (substring OK)
  required_fields?: string[];     // path strings like "data.command" that must resolve to non-empty
  min_items?: { path: string; n: number }[]; // e.g. data.categories.length >= 10
};

const CASES: Case[] = [
  { name: "schema_all", argv: ["schema"], expect_ok: true,
    required_fields: ["data.commands", "data.types"],
    min_items: [{ path: "data.commands", n: 4 }, { path: "data.types", n: 1 }] },
  { name: "schema_search", argv: ["schema", "search"], expect_ok: true,
    required_fields: ["data.command", "data.args", "data.response"] },
  { name: "schema_paper", argv: ["schema", "paper"], expect_ok: true,
    required_fields: ["data.command", "data.args", "data.response"] },
  { name: "schema_type_paper", argv: ["schema", "Paper"], expect_ok: true,
    required_fields: ["data.type", "data.fields"] },
  { name: "categories", argv: ["categories"], expect_ok: true,
    required_fields: ["data"],
    min_items: [{ path: "data", n: 10 }] },
  { name: "err_no_command", argv: [], expect_ok: false, expect_code: "NO_COMMAND",
    required_fields: ["error", "code"] },
  { name: "err_unknown", argv: ["foobar"], expect_ok: false, expect_code: "UNKNOWN",
    required_fields: ["error", "code"] },
  { name: "err_paper_no_id", argv: ["paper"], expect_ok: false, expect_code: "MISSING",
    required_fields: ["error", "code"] },
  { name: "err_download_no_id", argv: ["download"], expect_ok: false, expect_code: "MISSING",
    required_fields: ["error", "code"] },
  { name: "err_bad_paper_id", argv: ["paper", "not a real id"], expect_ok: false,
    required_fields: ["error", "code"] },
];

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc == null) return acc;
    return (acc as Record<string, unknown>)[k];
  }, obj);
}

function nonEmpty(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

function runCase(c: Case): { ok: boolean; bytes: number; reason?: string; elapsedMs: number } {
  const t0 = performance.now();
  const r = spawnSync("bun", ["run", "src/index.ts", ...c.argv], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const elapsedMs = performance.now() - t0;
  const stdout = r.stdout ?? "";
  const bytes = Buffer.byteLength(stdout, "utf8");

  let payload: unknown;
  try {
    payload = JSON.parse(stdout);
  } catch (e) {
    return { ok: false, bytes, elapsedMs, reason: `invalid JSON: ${String(e).slice(0, 80)}` };
  }

  const p = payload as { ok?: boolean; code?: string; error?: string; data?: unknown };
  if (p.ok !== c.expect_ok) return { ok: false, bytes, elapsedMs, reason: `ok=${p.ok} expected ${c.expect_ok}` };
  if (c.expect_code && !(p.code ?? "").toUpperCase().includes(c.expect_code.toUpperCase()))
    return { ok: false, bytes, elapsedMs, reason: `code=${p.code} expected ~${c.expect_code}` };
  for (const f of c.required_fields ?? []) {
    const v = resolvePath(payload, f);
    if (!nonEmpty(v)) return { ok: false, bytes, elapsedMs, reason: `missing/empty ${f}` };
  }
  for (const m of c.min_items ?? []) {
    const v = resolvePath(payload, m.path);
    const n = Array.isArray(v) ? v.length : (typeof v === "object" && v ? Object.keys(v).length : 0);
    if (n < m.n) return { ok: false, bytes, elapsedMs, reason: `${m.path} has ${n}, need >= ${m.n}` };
  }

  return { ok: true, bytes, elapsedMs };
}

function main() {
  let totalBytes = 0;
  let okCount = 0;
  let totalMs = 0;
  const reasons: string[] = [];
  for (const c of CASES) {
    const r = runCase(c);
    totalMs += r.elapsedMs;
    totalBytes += r.bytes;
    if (r.ok) okCount++;
    else reasons.push(`[${c.name}] ${r.reason}`);
  }
  const all_ok = okCount === CASES.length;
  const line = `METRICS bytes=${totalBytes} cases_ok=${okCount}/${CASES.length} ms=${totalMs.toFixed(0)} correct=${all_ok ? 1 : 0}`;
  console.log(line);
  if (!all_ok) {
    console.log("FAILURES:");
    for (const r of reasons) console.log("  " + r);
    process.exit(1);
  }
}

main();
