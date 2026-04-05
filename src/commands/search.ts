import { search } from "../api";
import { scrapeSearch } from "../scrape";
import { ok, err, pickFields, type CLIOutput, type SearchResult, type Paper } from "../types";
import { validateCategory } from "../validate";

export async function searchCommand(args: string[]): Promise<CLIOutput<SearchResult>> {
  const flags = parseFlags(args);

  if (!flags.query) {
    return err("MISSING_QUERY", "Missing required argument: query. Usage: arxiv search <query> [--max <n>] [--start <n>] [--sort <field>] [--order <asc|desc>] [--category <cat>] [--fields <f1,f2>] [--type <searchtype>]");
  }

  if (flags.category) {
    const catErr = validateCategory(flags.category);
    if (catErr) return catErr;
  }

  let result: SearchResult;

  if (flags.useAtomApi) {
    let query = flags.query;
    if (flags.category) query = `cat:${flags.category} AND (${query})`;

    result = await search({
      query,
      maxResults: flags.max,
      start: flags.start,
      sortBy: flags.sort as any,
      sortOrder: flags.order === "asc" ? "ascending" : flags.order === "desc" ? "descending" : undefined,
    });
  } else {
    let query = flags.query;
    if (flags.category) query = `${query} AND cat:${flags.category}`;

    // Map sort flags to arxiv.org search order param
    let order: string | undefined;
    if (flags.sort === "submittedDate") order = flags.order === "asc" ? "announced_date_first" : "-announced_date_first";
    else if (flags.sort === "lastUpdatedDate") order = flags.order === "asc" ? "announced_date_first" : "-announced_date_first";
    else if (flags.sort === "relevance") order = "-relevance";

    result = await scrapeSearch({
      query,
      searchtype: flags.searchtype,
      start: flags.start,
      size: flags.max,
      order,
    });
  }

  if (flags.fields) {
    result.papers = result.papers.map((p) => pickFields(p, flags.fields!) as Paper);
  }

  return ok(result);
}

function parseFlags(args: string[]) {
  let max = 10;
  let start = 0;
  let sort: string | undefined;
  let order: string | undefined;
  let category: string | undefined;
  let fields: string[] | undefined;
  let searchtype: "all" | "title" | "author" | "abstract" = "all";
  let useAtomApi = false;

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max" || arg === "-n") {
      max = parseInt(args[++i] ?? "10");
    } else if (arg === "--start" || arg === "-s") {
      start = parseInt(args[++i] ?? "0");
    } else if (arg === "--sort") {
      sort = args[++i];
    } else if (arg === "--order") {
      order = args[++i];
    } else if (arg === "--category" || arg === "--cat" || arg === "-c") {
      category = args[++i];
    } else if (arg === "--fields") {
      fields = args[++i]?.split(",").map((f) => f.trim());
    } else if (arg === "--type" || arg === "-t") {
      searchtype = args[++i] as typeof searchtype;
    } else if (arg === "--api") {
      useAtomApi = true;
    } else {
      positional.push(arg);
    }
  }

  const query = positional.join(" ");
  return { query, max, start, sort, order, category, fields, searchtype, useAtomApi };
}
