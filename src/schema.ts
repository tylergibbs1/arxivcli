const SCHEMAS: Record<string, object> = {
  search: {
    command: "search",
    description: "Search arXiv papers by query string. Scrapes arxiv.org HTML by default (no API key needed).",
    args: {
      query: { type: "string", required: true, positional: true, description: "Search query (arXiv query syntax supported)" },
      "--max, -n": { type: "integer", default: 10, description: "Maximum number of results" },
      "--start, -s": { type: "integer", default: 0, description: "Start index for pagination" },
      "--sort": { type: "enum", values: ["relevance", "lastUpdatedDate", "submittedDate"], description: "Sort field" },
      "--order": { type: "enum", values: ["asc", "desc"], description: "Sort order" },
      "--category, --cat, -c": { type: "string", description: "Filter by arXiv category (e.g. cs.AI)" },
      "--type, -t": { type: "enum", values: ["all", "title", "author", "abstract"], default: "all", description: "Search field type (scrape mode only)" },
      "--fields": { type: "string", description: "Comma-separated list of paper fields to return" },
      "--api": { type: "boolean", description: "Use Atom XML API instead of HTML scraping" },
    },
    response: {
      query: "string",
      totalResults: "integer",
      startIndex: "integer",
      itemsPerPage: "integer",
      papers: "Paper[]",
    },
  },
  paper: {
    command: "paper",
    description: "Get full metadata for a single paper by arXiv ID. Scrapes the abstract page by default.",
    args: {
      id: { type: "string", required: true, positional: true, description: "arXiv paper ID (e.g. 2301.07041)" },
      "--fields": { type: "string", description: "Comma-separated list of paper fields to return" },
      "--api": { type: "boolean", description: "Use Atom XML API instead of HTML scraping" },
    },
    response: "Paper",
  },
  download: {
    command: "download",
    description: "Download a paper's PDF to disk",
    args: {
      id: { type: "string", required: true, positional: true, description: "arXiv paper ID" },
      "--output, -o": { type: "string", description: "Output file path (default: <id>.pdf)" },
      "--dry-run": { type: "boolean", description: "Validate and resolve PDF URL without downloading" },
      "--api": { type: "boolean", description: "Use Atom XML API instead of HTML scraping" },
    },
    response: { id: "string", path: "string", pdfUrl: "string (dry-run only)" },
  },
  list: {
    command: "list",
    description: "List recent papers in an arXiv category",
    args: {
      category: { type: "string", required: true, positional: true, description: "arXiv category (e.g. cs.AI, stat.ML)" },
      "--max, -n": { type: "integer", default: 10, description: "Maximum number of results" },
      "--fields": { type: "string", description: "Comma-separated list of paper fields to return" },
      "--api": { type: "boolean", description: "Use Atom XML API instead of HTML scraping" },
    },
    response: "SearchResult",
  },
  categories: {
    command: "categories",
    description: "List common arXiv categories with descriptions",
    args: {},
    response: "Record<string, string>",
  },
  Paper: {
    type: "object",
    fields: {
      id: "string — arXiv ID (e.g. 2301.07041)",
      title: "string",
      summary: "string — abstract text",
      authors: "string[]",
      published: "string — ISO 8601 datetime (paper command only)",
      updated: "string — ISO 8601 datetime (paper command only)",
      categories: "string[] — all arXiv categories",
      primaryCategory: "string",
      links: "{ href, type?, title? }[]",
      pdfUrl: "string | null",
      doi: "string | null (paper command only)",
      comment: "string | null (paper command only)",
      journalRef: "string | null (paper command only)",
    },
  },
};

export function schemaCommand(args: string[]): { ok: boolean; code?: string; data?: object; error?: string } {
  const target = args[0];

  if (!target) {
    return { ok: true, data: { commands: Object.keys(SCHEMAS).filter(k => k !== "Paper"), types: ["Paper"] } };
  }

  const schema = SCHEMAS[target];
  if (!schema) {
    return { ok: false, code: "UNKNOWN_SCHEMA", error: `Unknown schema: "${target}". Available: ${Object.keys(SCHEMAS).join(", ")}` };
  }

  return { ok: true, data: schema };
}
