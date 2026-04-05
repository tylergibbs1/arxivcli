import { getPaper } from "../api";
import type { CLIOutput, Paper } from "../types";

export async function paperCommand(args: string[]): Promise<CLIOutput<Paper>> {
  const id = args[0];
  if (!id) {
    return { ok: false, error: "Missing required argument: paper ID. Usage: arxiv paper <arxiv-id>" };
  }

  const paper = await getPaper(id);
  return { ok: true, data: paper };
}
