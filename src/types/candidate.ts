import type { Timestamp } from 'firebase/firestore';

// ── Enums ─────────────────────────────────────────────────────────────────────

export type MilitaryType =
  | 'combat'          // לוחם
  | 'support'         // תומכ"ל
  | 'national_service'// שירות לאומי
  | 'reserves'        // מילואים
  | 'none';           // לא שירת

export type CandidateStatus =
  | 'new'             // מילא שאלון - טרם טופל
  | 'reviewing'       // בטיפול
  | 'applied'         // הגיש מלגה
  | 'approved'        // אושר
  | 'rejected';       // נדחה

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

// ── Match Result ──────────────────────────────────────────────────────────────

export interface MatchBreakdown {
  field:        number; // 0–1
  sector:       number; // 0–1
  military:     number; // 0–1
  periphery:    number; // 0–1
  volunteering: number; // 0–1
}

export interface MatchResult {
  scholarshipId:   string;
  scholarshipName: string;
  score:           number; // 0–100, integer
  breakdown:       MatchBreakdown;
}

// ── Candidate ─────────────────────────────────────────────────────────────────

export interface Candidate {
  // ── Personal ────────────────────────────────────────────────────────────────
  name:          string;
  email:         string;
  phone:         string;
  maritalStatus: MaritalStatus;

  // ── Academic ────────────────────────────────────────────────────────────────
  studyField:  string; // e.g. 'הנדסה', 'רפואה', 'מחשבים', 'חינוך'
  institution: string;
  studyYear:   number; // 1–5+

  // ── Sector / Population ─────────────────────────────────────────────────────
  // Array — candidate may belong to multiple sectors.
  // Values match scholarship sector strings:
  // 'כללי' | 'דתי-לאומי' | 'חרדים' | 'חברה ערבית' | 'דרוזים' | 'אתיופיה' |
  // 'עולים' | 'דור ראשון' | 'נשים' | 'מוגבלויות' | 'מצוקה כלכלית' | 'חיילים בודדים' | ...
  sectors: string[];

  // ── Military ────────────────────────────────────────────────────────────────
  militaryService: boolean;
  militaryType:    MilitaryType;
  militaryYears:   number;
  reserveDays:     number; // total reserve duty days (significant for some scholarships)

  // ── Geography ───────────────────────────────────────────────────────────────
  periphery:     boolean;
  residenceArea: string; // e.g. 'ירושלים', 'חיפה', 'צפון', 'עוטף עזה', 'באר שבע'

  // ── Volunteering ────────────────────────────────────────────────────────────
  volunteering:        boolean;
  volunteeringHours:   number; // annual hours
  volunteeringWeeklyH: number; // weekly hours (some scholarships specify this)

  // ── Matching (computed by algorithm) ────────────────────────────────────────
  matchedScholarships: MatchResult[];

  // ── Admin ───────────────────────────────────────────────────────────────────
  status: CandidateStatus;
  notes?: string;

  // ── Timestamps ──────────────────────────────────────────────────────────────
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
