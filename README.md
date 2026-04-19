# arxiv

Agent-friendly CLI for searching and retrieving papers from arXiv. Built with TypeScript and Bun. **No API key required.**

Scrapes arxiv.org HTML by default — richer search filters (title/author/abstract search types) and no rate limits. Falls back to the Atom XML API with `--api`.

## Install

```bash
bun install
bun link   # makes `arxiv` available globally
```

## Commands

### search

Search arXiv papers by query. Supports title, author, and abstract-specific searches.

```bash
arxiv search "transformer attention mechanism" --max 5
arxiv search "large language models" --cat cs.CL --sort submittedDate --order desc
arxiv search "Yann LeCun" --type author --max 10
arxiv search "reinforcement learning" --fields id,title,authors,pdfUrl
arxiv search "diffusion models" --api    # use Atom XML API instead
```

| Flag | Description |
|---|---|
| `--max, -n` | Max results (default: 10) |
| `--start, -s` | Start index for pagination |
| `--sort` | `relevance`, `lastUpdatedDate`, or `submittedDate` |
| `--order` | `asc` or `desc` |
| `--category, --cat, -c` | Filter by category (e.g. `cs.AI`) |
| `--type, -t` | Search in: `all`, `title`, `author`, `abstract` (scrape mode only) |
| `--fields` | Comma-separated fields to return (reduces response size) |
| `--api` | Use Atom XML API instead of HTML scraping |

### paper

Get full metadata for a single paper. Scrapes the abstract page by default.

```bash
arxiv paper 2301.07041
arxiv paper 2301.07041 --fields id,title,summary,authors
```

### download

Download a paper's PDF.

```bash
arxiv download 2301.07041 -o paper.pdf
arxiv download 2301.07041 --dry-run  # resolve URL without downloading
```

### list

List recent papers in a category (uses Atom API).

```bash
arxiv list cs.AI --max 20
arxiv list stat.ML --fields id,title,published
```

### categories

List common arXiv categories.

```bash
arxiv categories
```

### schema

Introspect command schemas at runtime — agents can discover accepted arguments, types, and response shapes without parsing docs.

```bash
arxiv schema           # list all commands and types
arxiv schema search    # full schema for the search command
arxiv schema Paper     # Paper type definition
```

## How It Works

Two data engines, same output format:

| Engine | Used by default | How it works |
|---|---|---|
| **HTML scraping** | `search`, `paper`, `download` | Fetches arxiv.org pages, parses `citation_*` meta tags and search result HTML |
| **Atom XML API** | `list`, or any command with `--api` | Queries `export.arxiv.org/api/query`, parses XML |

Both are keyless and return the same `Paper` schema.

## Agent Design

- **Structured JSON output** — every response is `{ ok, code?, data?, error? }`, machine-parseable
- **Error codes** — typed `code` field (`INVALID_ID`, `MISSING_QUERY`, etc.) for programmatic error handling
- **Schema introspection** — `arxiv schema <command>` returns full argument/response schemas as JSON
- **Field filtering** — `--fields id,title,authors` limits response size to save context window budget
- **Dry-run** — `arxiv download --dry-run` validates and resolves without side effects
- **Input validation** — rejects path traversal, control characters, malformed IDs, and embedded query params
- **No interactive prompts** — pure stdin/stdout, no TTY required
- **No API key** — scrapes arxiv.org directly, zero auth setup

## Paper Fields

Available fields for `--fields` filtering:

`id`, `title`, `summary`, `authors`, `published`, `updated`, `categories`, `primaryCategory`, `links`, `pdfUrl`, `doi`, `comment`, `journalRef`

Note: `published`, `updated`, `doi`, `comment`, and `journalRef` are only populated by the `paper` command (or with `--api`). Search results from HTML scraping don't include dates.
