import { downloadPdf } from "../api";
import type { CLIOutput } from "../types";

export async function downloadCommand(args: string[]): Promise<CLIOutput<{ id: string; path: string }>> {
  const id = args[0];
  if (!id) {
    return { ok: false, error: "Missing required argument: paper ID. Usage: arxiv download <arxiv-id> [--output <path>]" };
  }

  let output: string | undefined;
  const outIdx = args.indexOf("--output");
  if (outIdx === -1) {
    const oIdx = args.indexOf("-o");
    if (oIdx !== -1) output = args[oIdx + 1];
  } else {
    output = args[outIdx + 1];
  }

  const path = await downloadPdf(id, output);
  return { ok: true, data: { id, path } };
}
