import type { Timestamp } from 'firebase/firestore';

/**
 * Matches the Scholarship interface from scholarship-wizard/src/types/index.ts
 * All criteria fields are strings:
 *   - ''        → not required / not applicable
 *   - 'V'       → required (yes, simple checkbox)
 *   - any text  → required with specific details (e.g. '140 שעות')
 */
export interface Scholarship {
  name:         string;
  volunteering: string;
  military:     string;
  periphery:    string;
  sector:       string;
  field:        string;
  amount:       string;
  openingDate:  string;
  link:         string;
  createdAt?:   Timestamp;
}

