export interface Paper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  categories: string[];
  primaryCategory: string;
  links: { href: string; type?: string; title?: string }[];
  pdfUrl: string | null;
  doi: string | null;
  comment: string | null;
  journalRef: string | null;
}

export interface SearchResult {
  query: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  papers: Paper[];
}

export interface CLIOutput<T = unknown> {
  ok: boolean;
  code?: string;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): CLIOutput<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): CLIOutput {
  return { ok: false, code, error: message };
}

// Field filtering: pick only requested keys from an object
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const f of fields) {
    if (f in obj) (result as any)[f] = (obj as any)[f];
  }
  return result;
}
