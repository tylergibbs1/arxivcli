import type { Paper, SearchResult } from "./types";

const SEARCH_URL = "https://arxiv.org/search/";
const ABS_URL = "https://arxiv.org/abs/";

// Valid page sizes for arxiv.org search
const VALID_SIZES = [25, 50, 100, 200] as const;

function closestValidSize(n: number): number {
  // Pick the smallest valid size >= n, or 200 if n > 200
  return VALID_SIZES.find((s) => s >= n) ?? 200;
}

// Scrape the arxiv.org HTML search page — richer filters than the Atom API, no key needed.
export async function scrapeSearch(opts: {
  query: string;
  searchtype?: "all" | "title" | "author" | "abstract";
  start?: number;
  size?: number;
  order?: string;
}): Promise<SearchResult> {
  const requestedSize = opts.size ?? 25;
  const pageSize = closestValidSize(requestedSize);

  const params = new URLSearchParams();
  params.set("query", opts.query);
  params.set("searchtype", opts.searchtype ?? "all");
  params.set("start", String(opts.start ?? 0));
  params.set("size", String(pageSize));
  if (opts.order) params.set("order", opts.order);

  const url = `${SEARCH_URL}?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "arxivcli/0.1.0 (https://github.com/tylergibbs1/arxivcli)" },
  });
  if (!res.ok) throw new Error(`arXiv search error: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const result = parseSearchHTML(html, opts.query);

  // Trim to requested size if we fetched more than needed
  if (result.papers.length > requestedSize) {
    result.papers = result.papers.slice(0, requestedSize);
    result.itemsPerPage = requestedSize;
  }

  return result;
}

function parseSearchHTML(html: string, query: string): SearchResult {
  // Extract total results from: "Showing 1–50 of 16,133 results"
  const totalMatch = html.match(/of\s+([\d,]+)\s+results/);
  const totalResults = totalMatch ? parseInt(totalMatch[1].replace(/,/g, "")) : 0;

  const startMatch = html.match(/Showing\s+(\d+)/);
  const startIndex = startMatch ? parseInt(startMatch[1]) - 1 : 0;

  // Extract each result block
  const papers: Paper[] = [];
  const resultBlocks = html.split(/<li class="arxiv-result">/);
  // First element is everything before the first result
  for (let i = 1; i < resultBlocks.length; i++) {
    const block = resultBlocks[i];
    const paper = parseResultBlock(block);
    if (paper) papers.push(paper);
  }

  return {
    query,
    totalResults,
    startIndex,
    itemsPerPage: papers.length,
    papers,
  };
}

function parseResultBlock(block: string): Paper | null {
  // ID: <a href="https://arxiv.org/abs/2604.02327">arXiv:2604.02327</a>
  const idMatch = block.match(/arxiv\.org\/abs\/([\d.]+(?:v\d+)?)/);
  if (!idMatch) return null;
  const id = idMatch[1].replace(/v\d+$/, "");

  // Title: <p class="title is-5 mathjax">...</p>
  const titleMatch = block.match(/<p class="title[^"]*">\s*([\s\S]*?)\s*<\/p>/);
  const title = titleMatch ? stripHtml(titleMatch[1]).replace(/\s+/g, " ").trim() : "";

  // Authors: <p class="authors">...<a href="...">Author Name</a>...</p>
  const authorsMatch = block.match(/<p class="authors">([\s\S]*?)<\/p>/);
  const authors: string[] = [];
  if (authorsMatch) {
    const authorLinks = authorsMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g);
    for (const m of authorLinks) {
      authors.push(m[1].trim());
    }
  }

  // Abstract: <span class="abstract-full ...">...</span>
  const abstractMatch = block.match(/<span class="abstract-full[^"]*">\s*([\s\S]*?)(?:<a|<\/span>)/);
  let summary = "";
  if (abstractMatch) {
    summary = stripHtml(abstractMatch[1]).replace(/\s+/g, " ").trim();
  } else {
    // Fallback: short abstract
    const shortMatch = block.match(/<span class="abstract-short[^"]*">\s*([\s\S]*?)(?:<a|<\/span>)/);
    if (shortMatch) summary = stripHtml(shortMatch[1]).replace(/\s+/g, " ").trim();
  }
  // Remove trailing "△ Less" artifact
  summary = summary.replace(/\s*△\s*Less\s*$/, "").trim();

  // Categories/tags: <span class="tag ...">cs.CV</span>
  const categories: string[] = [];
  const tagMatches = block.matchAll(/<span class="tag[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/g);
  for (const m of tagMatches) {
    const cat = m[1].trim();
    if (cat && /^[a-z]/.test(cat)) categories.push(cat);
  }

  // PDF link
  const pdfMatch = block.match(/href="(https?:\/\/arxiv\.org\/pdf\/[^"]+)"/);
  const pdfUrl = pdfMatch ? pdfMatch[1] : null;

  return {
    id,
    title,
    summary,
    authors,
    published: "", // not available in search results
    updated: "",
    categories,
    primaryCategory: categories[0] ?? "",
    links: [
      { href: `https://arxiv.org/abs/${id}`, type: "text/html" },
      ...(pdfUrl ? [{ href: pdfUrl, type: "application/pdf", title: "pdf" as string }] : []),
    ],
    pdfUrl,
    doi: null,
    comment: null,
    journalRef: null,
  };
}

// Scrape paper metadata from the abstract page's citation meta tags
export async function scrapePaper(id: string): Promise<Paper> {
  const url = `${ABS_URL}${id}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "arxivcli/0.1.0 (https://github.com/tylergibbs1/arxivcli)" },
  });
  if (!res.ok) throw new Error(`arXiv abs page error: ${res.status} ${res.statusText}`);

  const html = await res.text();
  return parseAbsHTML(html, id);
}

function parseAbsHTML(html: string, id: string): Paper {
  const meta = (name: string): string => {
    const m = html.match(new RegExp(`<meta name="${name}"\\s+content="([^"]*)"`, "i"));
    return m ? m[1] : "";
  };

  const metaAll = (name: string): string[] => {
    const results: string[] = [];
    const re = new RegExp(`<meta name="${name}"\\s+content="([^"]*)"`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) results.push(m[1]);
    return results;
  };

  const title = meta("citation_title");
  const authors = metaAll("citation_author").map((a) =>
    // "Last, First" -> "First Last"
    a.includes(",") ? a.split(",").map((s) => s.trim()).reverse().join(" ") : a
  );
  const published = meta("citation_date");
  const updated = meta("citation_online_date");
  const pdfUrl = meta("citation_pdf_url") || null;
  const doi = meta("citation_doi") || null;
  const arxivId = meta("citation_arxiv_id") || id;

  // Abstract from meta tag
  const summary = meta("citation_abstract").replace(/\s+/g, " ").trim();

  // Categories from the page
  const categories: string[] = [];
  const catMatch = html.match(/<td class="tablecell subjects">([\s\S]*?)<\/td>/);
  if (catMatch) {
    const catTags = catMatch[1].matchAll(/\(([a-z][a-z-]*\.[A-Za-z-]+)\)/g);
    for (const m of catTags) categories.push(m[1]);
  }
  // Also try primary category from span
  const primaryMatch = html.match(/<span class="primary-subject">([^<]*\(([^)]+)\))/);
  const primaryCategory = primaryMatch ? primaryMatch[2] : categories[0] ?? "";
  if (primaryCategory && !categories.includes(primaryCategory)) {
    categories.unshift(primaryCategory);
  }

  // Comment
  const commentMatch = html.match(/<td class="tablecell comments[^"]*">([\s\S]*?)<\/td>/);
  const comment = commentMatch ? stripHtml(commentMatch[1]).trim() : null;

  // Journal ref
  const journalMatch = html.match(/<td class="tablecell jref">([\s\S]*?)<\/td>/);
  const journalRef = journalMatch ? stripHtml(journalMatch[1]).trim() : null;

  return {
    id: arxivId.replace(/v\d+$/, ""),
    title,
    summary,
    authors,
    published,
    updated,
    categories,
    primaryCategory,
    links: [
      { href: `https://arxiv.org/abs/${arxivId}`, type: "text/html" },
      ...(pdfUrl ? [{ href: pdfUrl, type: "application/pdf", title: "pdf" }] : []),
    ],
    pdfUrl,
    doi,
    comment,
    journalRef,
  };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
