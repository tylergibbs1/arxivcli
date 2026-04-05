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
  data?: T;
  error?: string;
}
