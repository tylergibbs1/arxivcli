const SCHEMAS: Record<string, object> = {
  search: {
    command: "search",
    description: "Search arXiv papers by query string",
    args: {
      query: { type: "string", required: true, positional: true, description: "Search query (arXiv query syntax supported)" },
      "--max, -n": { type: "integer", default: 10, description: "Maximum number of results" },
      "--start, -s": { type: "integer", default: 0, description: "Start index for pagination" },
      "--sort": { type: "enum", values: ["relevance", "lastUpdatedDate", "submittedDate"], description: "Sort field" },
      "--order": { type: "enum", values: ["asc", "desc"], description: "Sort order" },
      "--category, --cat, -c": { type: "string", description: "Filter by arXiv category (e.g. cs.AI)" },
      "--fields": { type: "string", description: "Comma-separated list of paper fields to return" },
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
    description: "Get full metadata for a single paper by arXiv ID",
    args: {
      id: { type: "string", required: true, positional: true, description: "arXiv paper ID (e.g. 2301.07041)" },
      "--fields": { type: "string", description: "Comma-separated list of paper fields to return" },
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
      published: "string — ISO 8601 datetime",
      updated: "string — ISO 8601 datetime",
      categories: "string[] — all arXiv categories",
      primaryCategory: "string",
      links: "{ href, type?, title? }[]",
      pdfUrl: "string | null",
      doi: "string | null",
      comment: "string | null",
      journalRef: "string | null",
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
