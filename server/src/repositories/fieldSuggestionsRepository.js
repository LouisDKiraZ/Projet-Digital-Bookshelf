// Powers the "reuse a previous criterion" suggestions in the shelf
// creation wizard: every distinct (label, field type) pair ever defined on
// any item type, across every shelf. No separate "field template" table —
// item_type_fields already holds everything needed.

import { db } from '../db/connection.js';

const selectDistinctFields = db.prepare(`
  SELECT label, field_type, list_options, COUNT(*) as usage_count
  FROM item_type_fields
  GROUP BY label, field_type, list_options
  ORDER BY usage_count DESC, label ASC
  LIMIT 50
`);

export function listFieldSuggestions() {
  return selectDistinctFields.all().map((row) => ({
    label: row.label,
    fieldType: row.field_type,
    listOptions: row.list_options ? JSON.parse(row.list_options) : null,
  }));
}
