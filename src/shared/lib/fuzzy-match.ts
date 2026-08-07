export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

function toleranceFor(length: number): number {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

export function fuzzyMatch(haystack: string, query: string): boolean {
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;
  if (normalizedHaystack.includes(normalizedQuery)) return true;

  const tolerance = toleranceFor(normalizedQuery.length);
  if (tolerance === 0) return false;

  const words = normalizedHaystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.some(
    (word) => Math.abs(word.length - normalizedQuery.length) <= tolerance && levenshteinDistance(word, normalizedQuery) <= tolerance
  );
}
