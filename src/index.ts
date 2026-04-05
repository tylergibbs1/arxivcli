#!/usr/bin/env bun

import { searchCommand } from "./commands/search";
import { paperCommand } from "./commands/paper";
import { downloadCommand } from "./commands/download";
import { listCommand, categoriesCommand } from "./commands/list";
import type { CLIOutput } from "./types";

const HELP = `arxiv — agent-friendly arXiv CLI

Commands:
  search <query>              Search papers. Returns structured JSON results.
    --max, -n <num>           Max results (default: 10)
    --start, -s <num>         Start index for pagination (default: 0)
    --sort <field>            Sort by: relevance | lastUpdatedDate | submittedDate
    --order <dir>             Order: asc | desc
    --category, --cat, -c     Filter by category (e.g. cs.AI)

  paper <arxiv-id>            Get full metadata for a single paper.

  download <arxiv-id>         Download paper PDF.
    --output, -o <path>       Output file path

  list <category>             List recent papers in a category.
    --max, -n <num>           Max results (default: 10)

  categories                  List common arXiv categories.

  help                        Show this help message.

Output:
  All commands output JSON to stdout: { ok: boolean, data?: ..., error?: string }
  Exit code 0 on success, 1 on error.

Examples:
  arxiv search "transformer attention mechanism" --max 5
  arxiv search "large language models" --cat cs.CL --sort submittedDate --order desc
  arxiv paper 2301.07041
  arxiv download 2301.07041 -o paper.pdf
  arxiv list cs.AI --max 20
`;

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    if (!command) {
      output({ ok: false, error: "No command provided. Use 'arxiv help' for usage." });
      process.exit(1);
    }
    process.stdout.write(HELP);
    process.exit(0);
  }

  let result: CLIOutput;

  switch (command) {
    case "search":
      result = await searchCommand(args);
      break;
    case "paper":
      result = await paperCommand(args);
      break;
    case "download":
      result = await downloadCommand(args);
      break;
    case "list":
      result = await listCommand(args);
      break;
    case "categories":
      result = categoriesCommand();
      break;
    default:
      result = { ok: false, error: `Unknown command: ${command}. Use 'arxiv help' for usage.` };
  }

  output(result);
  process.exit(result.ok ? 0 : 1);
}

function output(data: CLIOutput) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

main().catch((err) => {
  output({ ok: false, error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
