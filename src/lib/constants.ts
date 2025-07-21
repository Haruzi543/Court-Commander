// This file is kept for default values if the data file is ever corrupted or deleted.
// The primary source of truth for courts and time slots is now data/db.json.

import type { Court } from "./types";

export const DEFAULT_COURTS: Court[] = [
  { id: 1, name: "Court 1" },
  { id: 2, name: "Court 2" },
  { id: 3, name: "Court 3" },
  { id: 4, name: "Court 4" },
];

export const DEFAULT_TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
];

export const DEFAULT_HOURLY_RATE = 20;
