# arxiv

Agent-friendly CLI for searching and retrieving papers from arXiv. Built with TypeScript and Bun.

Every command returns structured JSON to stdout (`{ ok, code?, data?, error? }`) with proper exit codes — designed for programmatic consumption by AI agents and scripts.

## Install

```bash
bun install
bun link   # makes `arxiv` available globally
```

## Commands

### search

Search arXiv papers by query. Supports the full [arXiv query syntax](https://info.arxiv.org/help/api/user-manual.html#query_details).

```bash
arxiv search "transformer attention mechanism" --max 5
arxiv search "large language models" --cat cs.CL --sort submittedDate --order desc
arxiv search "reinforcement learning" --fields id,title,authors,pdfUrl
```

| Flag | Description |
|---|---|
| `--max, -n` | Max results (default: 10) |
| `--start, -s` | Start index for pagination |
| `--sort` | `relevance`, `lastUpdatedDate`, or `submittedDate` |
| `--order` | `asc` or `desc` |
| `--category, --cat, -c` | Filter by category (e.g. `cs.AI`) |
| `--fields` | Comma-separated fields to return (reduces response size) |

### paper

Get full metadata for a single paper.

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

List recent papers in a category.

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

## Agent Design

This CLI follows agent-first design principles:

- **Structured JSON output** — every response is `{ ok, code?, data?, error? }`, machine-parseable
- **Error codes** — typed `code` field (`INVALID_ID`, `MISSING_QUERY`, etc.) for programmatic error handling
- **Schema introspection** — `arxiv schema <command>` returns full argument/response schemas as JSON
- **Field filtering** — `--fields id,title,authors` limits response size to save context window budget
- **Dry-run** — `arxiv download --dry-run` validates and resolves without side effects
- **Input validation** — rejects path traversal, control characters, malformed IDs, and embedded query params
- **No interactive prompts** — pure stdin/stdout, no TTY required
- **Proper exit codes** — 0 on success, 1 on error

## Paper Fields

Available fields for `--fields` filtering:

`id`, `title`, `summary`, `authors`, `published`, `updated`, `categories`, `primaryCategory`, `links`, `pdfUrl`, `doi`, `comment`, `journalRef`
