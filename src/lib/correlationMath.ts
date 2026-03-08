// Cholesky decomposition for correlation-aware portfolio simulation

/**
 * Compute the Cholesky decomposition of a symmetric positive-definite matrix.
 * Returns lower-triangular matrix L such that L * L^T = A.
 */
export function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        const val = matrix[i][i] - sum;
        L[i][j] = Math.sqrt(Math.max(0, val));
      } else {
        L[i][j] = L[j][j] > 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
      }
    }
  }
  return L;
}

/**
 * Generate correlated uniform random variables using correlation matrix.
 * Returns array of correlated uniform [0,1] values.
 */
export function correlatedUniformDraws(
  L: number[][],
  random: () => number = Math.random
): number[] {
  const n = L.length;
  // Generate independent standard normal draws using Box-Muller
  const z: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = random();
    const u2 = random();
    z.push(Math.sqrt(-2 * Math.log(Math.max(1e-10, u1))) * Math.cos(2 * Math.PI * u2));
  }

  // Multiply by Cholesky factor to get correlated normals
  const correlated: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      correlated[i] += L[i][j] * z[j];
    }
  }

  // Convert to uniform via normal CDF (approximation)
  return correlated.map(normalCDF);
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Build a correlation matrix from pairwise correlation values.
 * correlations is a flat array of upper-triangle values.
 */
export function buildCorrelationMatrix(n: number, correlations: Record<string, number>): number[][] {
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const key = `${i}-${j}`;
      const val = correlations[key] ?? 0;
      matrix[i][j] = val;
      matrix[j][i] = val;
    }
  }
  return matrix;
}
