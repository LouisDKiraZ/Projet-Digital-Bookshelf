// The field types a shelf creator can pick from when defining a custom
// criterion for an item type. This is the ONE place that lists them: the
// DB schema's CHECK constraint, request validation, the suggestions
// endpoint, and the GET /api/field-types route the client fetches from
// all read from here instead of repeating the list.

export const FIELD_TYPES = [
  {
    id: 'text',
    label: 'Text',
    description: 'A short line of text, e.g. a title or an author name.',
    hasOptions: false,
  },
  {
    id: 'number',
    label: 'Number',
    description: 'A numeric value, e.g. a price or a page count.',
    hasOptions: false,
  },
  {
    id: 'date',
    label: 'Date',
    description: 'A calendar date, e.g. a purchase date.',
    hasOptions: false,
  },
  {
    id: 'list',
    label: 'List of options',
    description: 'A choice from a fixed set of options, e.g. a genre.',
    hasOptions: true,
  },
  {
    id: 'photo',
    label: 'Photo',
    description: 'An image, e.g. a cover photo.',
    hasOptions: false,
  },
  {
    id: 'person',
    label: 'Person',
    description: 'A reference to someone on the shelf, e.g. a real-world owner or borrower.',
    hasOptions: false,
  },
];

export const FIELD_TYPE_IDS = FIELD_TYPES.map((type) => type.id);

export function isValidFieldType(id) {
  return FIELD_TYPE_IDS.includes(id);
}

export function fieldTypeHasOptions(id) {
  return FIELD_TYPES.find((type) => type.id === id)?.hasOptions ?? false;
}
