/**
 * Matching algorithm: scores a Candidate against a Scholarship.
 *
 * Scholarship criteria fields use the convention:
 *   ''        → no requirement (anyone qualifies)
 *   'V'       → required (yes, simple checkbox)
 *   any text  → required with specifics (e.g. '140 שעות', 'V (לוחמים)')
 *
 * Scoring per dimension → 0 (knockout) | 0–1 (partial) | 1 (full match)
 * Weights: field(2.5) sector(2.5) military(1.5) periphery(1.5) volunteering(1.0)
 * Final score = weighted average × 100, rounded to integer.
 *
 * Open scholarships (all criteria empty) → base score 65.
 */

import type { Candidate, MatchResult, MatchBreakdown } from '../types/candidate';
import type { Scholarship } from '../types/scholarship';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract annual hours from strings like '140 שעות', 'כ140', '140+' → 140 */
function parseHours(text: string): number | null {
  const m = text.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** Extract weekly hours from strings like 'כ 6 שעות שבועיות', '6 שעות' → 6 */
function parseWeeklyHours(text: string): number | null {
  // Look for "שבועי" or "שבועיות" nearby
  if (/שבועי/.test(text)) {
    const m = text.match(/\d+/);
    return m ? Number(m[0]) : null;
  }
  return null;
}

/** Normalise a Hebrew sector string for comparison (trim, lower-case-equivalent) */
function normSector(s: string) {
  return s.trim();
}

// ── Dimension Scorers ─────────────────────────────────────────────────────────

/**
 * Field of study match.
 * If scholarship has no field requirement → 1.
 * If requirement is set (any non-empty string) → 1 if candidate's studyField
 * contains the scholarship field keyword, else 0 (hard knockout).
 */
function scoreField(candidate: Candidate, scholarship: Scholarship): number {
  if (!scholarship.field) return 1;
  const req = scholarship.field.trim().toLowerCase();
  const cand = candidate.studyField.trim().toLowerCase();
  if (cand.includes(req) || req.includes(cand)) return 1;
  // Try word overlap
  const reqWords = req.split(/[\s,/]+/).filter(Boolean);
  const candWords = cand.split(/[\s,/]+/).filter(Boolean);
  if (reqWords.some(w => candWords.includes(w))) return 1;
  return 0;
}

/**
 * Sector / population match.
 * '' → anyone qualifies → 1.
 * Otherwise candidate's sector must match the scholarship's sector string.
 * 'נשים' → also check if candidate is in a women-related profile (we treat sector match literally).
 * 'כללי' → open to all → 1.
 */
function scoreSector(candidate: Candidate, scholarship: Scholarship): number {
  const req = normSector(scholarship.sector);
  if (!req || req === 'כללי') return 1;

  // Candidate may have multiple sectors — match if ANY sector matches the requirement
  const candSectors = (candidate.sectors ?? []).map(normSector);

  for (const candSector of candSectors) {
    if (candSector === req) return 1;
    if (candSector.includes(req) || req.includes(candSector)) return 1;
  }

  return 0; // hard knockout — none of the candidate's sectors match
}

/**
 * Military service match.
 * '' → no requirement → 1.
 * 'V' → any military service → check candidate.militaryService.
 * 'V (מילואים)' → reserve duty → check candidate.militaryType === 'reserves'.
 * 'V (לוחמים)' → combat → check candidate.militaryType === 'combat'.
 * 'שירות צה"ל/לאומי' → military OR national_service.
 */
function scoreMilitary(candidate: Candidate, scholarship: Scholarship): number {
  const req = scholarship.military.trim();
  if (!req) return 1;

  if (!candidate.militaryService && candidate.militaryType === 'none') return 0;

  if (req === 'V') {
    return candidate.militaryService ? 1 : 0;
  }

  if (req.includes('מילואים')) {
    return candidate.militaryType === 'reserves' ? 1 : 0;
  }

  if (req.includes('לוחמים') || req.includes('לוחם')) {
    return candidate.militaryType === 'combat' ? 1 : 0;
  }

  if (req.includes('לאומי') || req.includes('צה"ל')) {
    return (candidate.militaryService || candidate.militaryType === 'national_service') ? 1 : 0;
  }

  // Generic 'V' with unrecognised suffix — require any service
  return candidate.militaryService ? 1 : 0;
}

/**
 * Periphery match.
 * '' → no requirement → 1.
 * 'V' → any periphery → check candidate.periphery.
 * 'V (חיפה)', 'V (צפון)', 'V (י-ם)', 'V (עוטף)', 'V (נגב)', etc.
 * → check residenceArea contains the keyword.
 */
function scorePeriphery(candidate: Candidate, scholarship: Scholarship): number {
  const req = scholarship.periphery.trim();
  if (!req) return 1;

  const areaReq = req.match(/\(([^)]+)\)/)?.[1]?.trim();

  if (!areaReq) {
    // 'V' with no region — just needs periphery flag
    return candidate.periphery ? 1 : 0;
  }

  // Map short region codes to search terms
  const regionMap: Record<string, string[]> = {
    'חיפה':  ['חיפה'],
    'צפון':  ['צפון', 'גליל', 'כנרת'],
    'י-ם':   ['ירושלים', 'י-ם'],
    'עוטף':  ['עוטף', 'שדרות', 'אשקלון', 'נגב מערבי'],
    'נגב':   ['נגב', 'באר שבע', 'ערד', 'דימונה'],
    'דרום':  ['דרום', 'נגב', 'באר שבע'],
  };

  const keywords = regionMap[areaReq] ?? [areaReq];
  const area = candidate.residenceArea.trim();
  if (keywords.some(k => area.includes(k))) return 1;

  // Fallback: candidate has periphery flag and is in that general area
  if (candidate.periphery && area) return 0.5;

  return 0;
}

/**
 * Volunteering match — allows partial credit.
 * '' → no requirement → 1.
 * 'V' → any volunteering → binary.
 * '140 שעות' → compare annual hours (candidate.volunteeringHours ≥ required).
 * 'כ 6 שעות שבועיות' → compare weekly hours (candidate.volunteeringWeeklyH ≥ required).
 * '?' → unknown requirement, give benefit of the doubt if candidate volunteers.
 */
function scoreVolunteering(candidate: Candidate, scholarship: Scholarship): number {
  const req = scholarship.volunteering.trim();
  if (!req) return 1;

  if (!candidate.volunteering) return 0;

  if (req === 'V' || req === '?') return 1;

  // Weekly hours requirement
  const weekly = parseWeeklyHours(req);
  if (weekly !== null) {
    if (candidate.volunteeringWeeklyH >= weekly) return 1;
    if (candidate.volunteeringWeeklyH > 0) return candidate.volunteeringWeeklyH / weekly; // partial
    return 0;
  }

  // Annual hours requirement
  const annual = parseHours(req);
  if (annual !== null) {
    if (candidate.volunteeringHours >= annual) return 1;
    if (candidate.volunteeringHours > 0) return candidate.volunteeringHours / annual; // partial
    return 0;
  }

  // Non-numeric text — candidate volunteers, so give credit
  return 0.8;
}

// ── Core Scorer ───────────────────────────────────────────────────────────────

const WEIGHTS = {
  field:        2.5,
  sector:       2.5,
  military:     1.5,
  periphery:    1.5,
  volunteering: 1.0,
};

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 9.5

/** Returns true if a scholarship criterion is "active" (non-empty). */
function isActive(val: string) {
  return val.trim() !== '';
}

/**
 * Score a single candidate ↔ scholarship pair.
 * Returns a MatchResult or null if the candidate is hard-knocked-out.
 */
function scoreScholarship(
  candidate: Candidate,
  scholarship: Scholarship,
  scholarshipId: string,
): MatchResult | null {
  const breakdown: MatchBreakdown = {
    field:        scoreField(candidate, scholarship),
    sector:       scoreSector(candidate, scholarship),
    military:     scoreMilitary(candidate, scholarship),
    periphery:    scorePeriphery(candidate, scholarship),
    volunteering: scoreVolunteering(candidate, scholarship),
  };

  // Hard knockout: any active criterion scored 0
  const activeCriteria = (
    (isActive(scholarship.field)        ? 1 : 0) +
    (isActive(scholarship.sector)       ? 1 : 0) +
    (isActive(scholarship.military)     ? 1 : 0) +
    (isActive(scholarship.periphery)    ? 1 : 0) +
    (isActive(scholarship.volunteering) ? 1 : 0)
  );

  if (activeCriteria === 0) {
    // Open scholarship — everyone qualifies at base score
    return {
      scholarshipId,
      scholarshipName: scholarship.name,
      score: 65,
      breakdown,
    };
  }

  // Knockout check
  if (isActive(scholarship.field)        && breakdown.field        === 0) return null;
  if (isActive(scholarship.sector)       && breakdown.sector       === 0) return null;
  if (isActive(scholarship.military)     && breakdown.military     === 0) return null;
  if (isActive(scholarship.periphery)    && breakdown.periphery    === 0) return null;

  // Weighted score
  const weighted =
    breakdown.field        * WEIGHTS.field        +
    breakdown.sector       * WEIGHTS.sector       +
    breakdown.military     * WEIGHTS.military     +
    breakdown.periphery    * WEIGHTS.periphery    +
    breakdown.volunteering * WEIGHTS.volunteering;

  const raw = weighted / TOTAL_WEIGHT; // 0–1
  const score = Math.round(raw * 100);

  return {
    scholarshipId,
    scholarshipName: scholarship.name,
    score,
    breakdown,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the full matching algorithm for a candidate against all scholarships.
 *
 * @param candidate     - The candidate to evaluate
 * @param scholarships  - Array of [id, Scholarship] tuples
 * @returns             MatchResult[] sorted by score descending, score > 0 only
 */
export function runMatching(
  candidate: Candidate,
  scholarships: Array<{ id: string; data: Scholarship }>,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const { id, data } of scholarships) {
    const result = scoreScholarship(candidate, data, id);
    if (result && result.score > 0) {
      results.push(result);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
