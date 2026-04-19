const SCHEMAS: Record<string, object> = {
  search: {
    command: "search",
    description: "Search arXiv papers; scrapes HTML by default.",
    args: {
      query: { type: "string", required: true, positional: true },
      "--max": { type: "integer", default: 10 },
      "--start": { type: "integer", default: 0 },
      "--sort": { values: ["relevance", "lastUpdatedDate", "submittedDate"] },
      "--order": { values: ["asc", "desc"] },
      "--category": { type: "string", description: "e.g. cs.AI" },
      "--type": { values: ["all", "title", "author", "abstract"], default: "all", description: "scrape only" },
      "--fields": { type: "string", description: "comma-sep Paper fields" },
      "--api": { type: "boolean", description: "use Atom XML API" },
    },
    response: { query: "string", totalResults: "integer", startIndex: "integer", itemsPerPage: "integer", papers: "Paper[]" },
  },
  paper: {
    command: "paper",
    description: "Get metadata for one paper.",
    args: {
      id: { type: "string", required: true, positional: true, description: "e.g. 2301.07041" },
      "--fields": { type: "string", description: "comma-sep Paper fields" },
      "--api": { type: "boolean", description: "use Atom XML API" },
    },
    response: "Paper",
  },
  download: {
    command: "download",
    description: "Download paper PDF.",
    args: {
      id: { type: "string", required: true, positional: true },
      "--output": { type: "string", description: "default <id>.pdf" },
      "--dry-run": { type: "boolean", description: "resolve URL only" },
      "--api": { type: "boolean", description: "use Atom XML API" },
    },
    response: { id: "string", path: "string", pdfUrl: "string (dry-run only)" },
  },
  list: {
    command: "list",
    description: "List recent papers in a category.",
    args: {
      category: { type: "string", required: true, positional: true, description: "e.g. cs.AI" },
      "--max": { type: "integer", default: 10 },
      "--fields": { type: "string", description: "comma-sep Paper fields" },
      "--api": { type: "boolean", description: "use Atom XML API" },
    },
    response: "SearchResult",
  },
  categories: {
    command: "categories",
    description: "List common arXiv categories.",
    args: {},
    response: "Record<string, string>",
  },
  Paper: {
    type: "object",
    fields: {
      id: "string",
      title: "string",
      summary: "string",
      authors: "string[]",
      published: "string",
      updated: "string",
      categories: "string[]",
      primaryCategory: "string",
      links: "{href,type?,title?}[]",
      pdfUrl: "string|null",
      doi: "string|null",
      comment: "string|null",
      journalRef: "string|null",
    },
    paperOnly: ["published", "updated", "doi", "comment", "journalRef"],
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
