import { search } from "../api";
import { ok, err, pickFields, type CLIOutput, type SearchResult, type Paper } from "../types";
import { validateCategory } from "../validate";

export async function searchCommand(args: string[]): Promise<CLIOutput<SearchResult>> {
  const flags = parseFlags(args);

  if (!flags.query) {
    return err("MISSING_QUERY", "Missing required argument: query. Usage: arxiv search <query> [--max <n>] [--start <n>] [--sort <field>] [--order <asc|desc>] [--category <cat>] [--fields <f1,f2>]");
  }

  let query = flags.query;
  if (flags.category) {
    const catErr = validateCategory(flags.category);
    if (catErr) return catErr;
    query = `cat:${flags.category} AND (${query})`;
  }

  const result = await search({
    query,
    maxResults: flags.max,
    start: flags.start,
    sortBy: flags.sort,
    sortOrder: flags.order,
  });

  if (flags.fields) {
    result.papers = result.papers.map((p) => pickFields(p, flags.fields!) as Paper);
  }

  return ok(result);
}

function parseFlags(args: string[]) {
  let max = 10;
  let start = 0;
  let sort: "relevance" | "lastUpdatedDate" | "submittedDate" | undefined;
  let order: "ascending" | "descending" | undefined;
  let category: string | undefined;
  let fields: string[] | undefined;

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max" || arg === "-n") {
      max = parseInt(args[++i] ?? "10");
    } else if (arg === "--start" || arg === "-s") {
      start = parseInt(args[++i] ?? "0");
    } else if (arg === "--sort") {
      sort = args[++i] as typeof sort;
    } else if (arg === "--order") {
      const v = args[++i];
      order = v === "asc" ? "ascending" : v === "desc" ? "descending" : undefined;
    } else if (arg === "--category" || arg === "--cat" || arg === "-c") {
      category = args[++i];
    } else if (arg === "--fields") {
      fields = args[++i]?.split(",").map((f) => f.trim());
    } else {
      positional.push(arg);
    }
  }

  const query = positional.join(" ");
  return { query, max, start, sort, order, category, fields };
}
