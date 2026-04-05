import { getPaper, downloadPdf } from "../api";
import { scrapePaper } from "../scrape";
import { ok, err, type CLIOutput } from "../types";
import { validateArxivId, validateOutputPath } from "../validate";

export async function downloadCommand(
  args: string[],
): Promise<CLIOutput<{ id: string; path?: string; pdfUrl?: string }>> {
  const id = args[0];
  const idErr = validateArxivId(id);
  if (idErr) return idErr;

  const dryRun = args.includes("--dry-run");
  const useAtomApi = args.includes("--api");

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
    const paper = useAtomApi ? await getPaper(id) : await scrapePaper(id);
    if (!paper.pdfUrl) return err("NO_PDF", `No PDF available for ${id}`);
    return ok({ id, pdfUrl: paper.pdfUrl });
  }

  // downloadPdf uses the Atom API internally — for scrape path, resolve URL then download
  if (useAtomApi) {
    const path = await downloadPdf(id, output);
    return ok({ id, path });
  }

  const paper = await scrapePaper(id);
  if (!paper.pdfUrl) return err("NO_PDF", `No PDF available for ${id}`);

  const res = await fetch(paper.pdfUrl);
  if (!res.ok) return err("DOWNLOAD_FAILED", `Failed to download PDF: ${res.status}`);

  const dest = output ?? `${id.replace("/", "_")}.pdf`;
  await Bun.write(dest, res);
  return ok({ id, path: dest });
}
