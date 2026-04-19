import { getPaper } from "../api";
import { scrapePaper } from "../scrape";
import { ok, err, pickFields, type CLIOutput, type Paper } from "../types";
import { validateArxivId } from "../validate";

export async function paperCommand(args: string[]): Promise<CLIOutput<Paper | Partial<Paper>>> {
  const id = args[0];
  const idErr = validateArxivId(id);
  if (idErr) return idErr;

  const useAtomApi = args.includes("--api");

  let fields: string[] | undefined;
  const fIdx = args.indexOf("--fields");
  if (fIdx !== -1) fields = args[fIdx + 1]?.split(",").map((f) => f.trim());

  const paper = useAtomApi ? await getPaper(id) : await scrapePaper(id);
  return ok(fields ? pickFields(paper, fields) as Partial<Paper> : paper);
}
