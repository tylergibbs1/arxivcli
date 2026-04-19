import { err, type CLIOutput } from "./types";

// arXiv IDs: YYMM.NNNNN or archive/YYMMNNN (old style)
const ARXIV_ID_RE = /^\d{4}\.\d{4,5}(v\d+)?$|^[a-z-]+\/\d{7}(v\d+)?$/;

// arXiv category: letters.LETTERS or letters.letters-letters
const CATEGORY_RE = /^[a-z-]+(\.[A-Z]{2,}[a-z]?|\.[-a-z]+)$/;

export function validateArxivId(id: string): CLIOutput | null {
  if (!id) return err("MISSING_ID", "Missing required argument: arXiv paper ID.");
  if (/[?#%]/.test(id)) return err("INVALID_ID", `ID contains invalid character. IDs must not contain ?, #, or %.`);
  if (/[\x00-\x1f]/.test(id)) return err("INVALID_ID", "ID contains control characters.");
  if (!ARXIV_ID_RE.test(id)) return err("INVALID_ID", `Invalid arXiv ID format: "${id}". Expected YYMM.NNNNN (e.g. 2301.07041).`);
  return null;
}

export function validateCategory(cat: string): CLIOutput | null {
  if (!cat) return err("MISSING_CATEGORY", "Missing required argument: category.");
  if (/[\x00-\x1f?#%]/.test(cat)) return err("INVALID_CATEGORY", "Category contains invalid characters.");
  if (!CATEGORY_RE.test(cat)) return err("INVALID_CATEGORY", `Invalid category format: "${cat}". Expected e.g. cs.AI, stat.ML.`);
  return null;
}

export function validateOutputPath(path: string): CLIOutput | null {
  if (/[\x00-\x1f]/.test(path)) return err("INVALID_PATH", "Output path contains control characters.");
  const resolved = Bun.resolveSync(path, process.cwd());
  const cwd = process.cwd();
  if (!resolved.startsWith(cwd)) return err("PATH_TRAVERSAL", `Output path must be within working directory. Resolved to: ${resolved}`);
  return null;
}
