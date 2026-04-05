import { getPaper } from "../api";
import { ok, err, pickFields, type CLIOutput, type Paper } from "../types";
import { validateArxivId } from "../validate";

export async function paperCommand(args: string[]): Promise<CLIOutput<Paper | Partial<Paper>>> {
  const id = args[0];
  const idErr = validateArxivId(id);
  if (idErr) return idErr;

  let fields: string[] | undefined;
  const fIdx = args.indexOf("--fields");
  if (fIdx !== -1) fields = args[fIdx + 1]?.split(",").map((f) => f.trim());

  const paper = await getPaper(id);
  return ok(fields ? pickFields(paper, fields) as Partial<Paper> : paper);
}
