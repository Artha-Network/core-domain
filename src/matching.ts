interface JurorProfile {
  id: string;
  reputationScore: number;
  tags: string[]; // e.g. "software", "legal", "crypto"
}

/**
 * Selects the best 3 jurors for a case.
 * Logic: Filter by tag -> Exclude conflicts -> Weighted Random Selection.
 */
export function selectJurors(
  pool: JurorProfile[],
  requiredTag: string,
  excludedIds: string[],
  seed: number // Random seed for reproducibility
): JurorProfile[] {
  
  // 1. Filter qualified candidates
  let candidates = pool.filter(j => 
    j.tags.includes(requiredTag) && 
    !excludedIds.includes(j.id) &&
    j.reputationScore > 50 // Minimum standard
  );

  // 2. Simple Linear Congruential Generator (LCG) for deterministic shuffle
  const shuffle = (array: any[]) => {
    let m = array.length, t, i;
    let localSeed = seed;
    while (m) {
      i = Math.floor(random(localSeed++) * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  };

  // Pseudo-random float 0-1
  const random = (s: number) => {
    var x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  // 3. Return top 3 after shuffle
  return shuffle(candidates).slice(0, 3);
}
