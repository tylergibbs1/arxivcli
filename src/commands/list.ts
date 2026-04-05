import { search } from "../api";
import type { CLIOutput, SearchResult } from "../types";

const CATEGORIES: Record<string, string> = {
  "cs.AI": "Artificial Intelligence",
  "cs.CL": "Computation and Language",
  "cs.CV": "Computer Vision",
  "cs.LG": "Machine Learning",
  "cs.CR": "Cryptography and Security",
  "cs.DS": "Data Structures and Algorithms",
  "cs.SE": "Software Engineering",
  "cs.PL": "Programming Languages",
  "cs.RO": "Robotics",
  "stat.ML": "Machine Learning (Statistics)",
  "math.CO": "Combinatorics",
  "physics.comp-ph": "Computational Physics",
  "q-bio.BM": "Biomolecules",
  "econ.GN": "General Economics",
};

export function categoriesCommand(): { ok: boolean; data: Record<string, string> } {
  return { ok: true, data: CATEGORIES };
}

export async function listCommand(args: string[]): Promise<CLIOutput<SearchResult>> {
  const category = args[0];
  if (!category) {
    return {
      ok: false,
      error: `Missing required argument: category. Usage: arxiv list <category> [--max <n>]\nCommon categories: ${Object.keys(CATEGORIES).join(", ")}`,
    };
  }

  let max = 10;
  const maxIdx = args.indexOf("--max");
  if (maxIdx !== -1) max = parseInt(args[maxIdx + 1] ?? "10");
  const nIdx = args.indexOf("-n");
  if (nIdx !== -1) max = parseInt(args[nIdx + 1] ?? "10");

  const result = await search({
    query: `cat:${category}`,
    maxResults: max,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  return { ok: true, data: result };
}
