import { getPaper, downloadPdf } from "../api";
import { ok, err, type CLIOutput } from "../types";
import { validateArxivId, validateOutputPath } from "../validate";

export async function downloadCommand(
  args: string[],
): Promise<CLIOutput<{ id: string; path?: string; pdfUrl?: string }>> {
  const id = args[0];
  const idErr = validateArxivId(id);
  if (idErr) return idErr;

  const dryRun = args.includes("--dry-run");

  let output: string | undefined;
  const outIdx = args.indexOf("--output");
  if (outIdx !== -1) output = args[outIdx + 1];
  const oIdx = args.indexOf("-o");
  if (oIdx !== -1) output = args[oIdx + 1];

  if (output) {
    const pathErr = validateOutputPath(output);
    if (pathErr) return pathErr;
  }

  if (dryRun) {
    const paper = await getPaper(id);
    if (!paper.pdfUrl) return err("NO_PDF", `No PDF available for ${id}`);
    return ok({ id, pdfUrl: paper.pdfUrl });
  }

  const path = await downloadPdf(id, output);
  return ok({ id, path });
}
