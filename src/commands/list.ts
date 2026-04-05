import { search } from "../api";
import { ok, err, pickFields, type CLIOutput, type SearchResult, type Paper } from "../types";
import { validateCategory } from "../validate";

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

export function categoriesCommand(): CLIOutput<Record<string, string>> {
  return ok(CATEGORIES);
}

export async function listCommand(args: string[]): Promise<CLIOutput<SearchResult>> {
  const category = args[0];
  const catErr = validateCategory(category);
  if (catErr) return catErr;

  let max = 10;
  let fields: string[] | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max" || arg === "-n") {
      max = parseInt(args[++i] ?? "10");
    } else if (arg === "--fields") {
      fields = args[++i]?.split(",").map((f) => f.trim());
    }
  }

  const result = await search({
    query: `cat:${category}`,
    maxResults: max,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  if (fields) {
    result.papers = result.papers.map((p) => pickFields(p, fields!) as Paper);
  }

  return ok(result);
}
