import { XMLParser } from "fast-xml-parser";
import type { Paper, SearchResult } from "./types";

const BASE_URL = "http://export.arxiv.org/api/query";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["entry", "author", "link", "category"].includes(name),
});

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function parsePaper(entry: any): Paper {
  const rawId: string = entry.id ?? "";
  const arxivId = rawId.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");

  const authors = ensureArray(entry.author).map(
    (a: any) => (typeof a === "string" ? a : a.name) ?? ""
  );

  const categories = ensureArray(entry.category).map(
    (c: any) => c["@_term"] ?? ""
  );

  const links = ensureArray(entry.link).map((l: any) => ({
    href: l["@_href"] ?? "",
    type: l["@_type"] ?? undefined,
    title: l["@_title"] ?? undefined,
  }));

  const pdfLink = links.find((l) => l.title === "pdf");

  return {
    id: arxivId,
    title: String(entry.title ?? "").replace(/\s+/g, " ").trim(),
    summary: String(entry.summary ?? "").replace(/\s+/g, " ").trim(),
    authors,
    published: entry.published ?? "",
    updated: entry.updated ?? "",
    categories,
    primaryCategory: entry["arxiv:primary_category"]?.["@_term"] ?? categories[0] ?? "",
    links,
    pdfUrl: pdfLink?.href ?? null,
    doi: entry["arxiv:doi"] ?? null,
    comment: entry["arxiv:comment"] ? String(entry["arxiv:comment"]).trim() : null,
    journalRef: entry["arxiv:journal_ref"] ?? null,
  };
}

export async function search(opts: {
  query: string;
  start?: number;
  maxResults?: number;
  sortBy?: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder?: "ascending" | "descending";
  idList?: string[];
}): Promise<SearchResult> {
  const params = new URLSearchParams();

  if (opts.query) params.set("search_query", opts.query);
  if (opts.idList?.length) params.set("id_list", opts.idList.join(","));
  params.set("start", String(opts.start ?? 0));
  params.set("max_results", String(opts.maxResults ?? 10));
  if (opts.sortBy) params.set("sortBy", opts.sortBy);
  if (opts.sortOrder) params.set("sortOrder", opts.sortOrder);

  const url = `${BASE_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`arXiv API error: ${res.status} ${res.statusText}`);

  const xml = await res.text();
  const doc = parser.parse(xml);
  const feed = doc.feed ?? doc;

  const totalResults =
    parseInt(feed["opensearch:totalResults"]?.["#text"] ?? feed["opensearch:totalResults"] ?? "0");
  const startIndex =
    parseInt(feed["opensearch:startIndex"]?.["#text"] ?? feed["opensearch:startIndex"] ?? "0");
  const itemsPerPage =
    parseInt(feed["opensearch:itemsPerPage"]?.["#text"] ?? feed["opensearch:itemsPerPage"] ?? "0");

  const entries = ensureArray(feed.entry);
  const papers = entries.map(parsePaper);

  return {
    query: opts.query,
    totalResults,
    startIndex,
    itemsPerPage,
    papers,
  };
}

export async function getPaper(id: string): Promise<Paper> {
  const result = await search({ query: "", idList: [id], maxResults: 1 });
  if (result.papers.length === 0) throw new Error(`Paper not found: ${id}`);
  return result.papers[0];
}

export async function downloadPdf(
  id: string,
  outputPath?: string
): Promise<string> {
  const paper = await getPaper(id);
  if (!paper.pdfUrl) throw new Error(`No PDF available for ${id}`);

  const res = await fetch(paper.pdfUrl);
  if (!res.ok) throw new Error(`Failed to download PDF: ${res.status}`);

  const dest = outputPath ?? `${id.replace("/", "_")}.pdf`;
  await Bun.write(dest, res);
  return dest;
}
