// Shared by the recipe form and the database constraints. Zod 4 and Postgres
// char_length / varchar(n) both count Unicode code points, so Chinese
// characters and emoji count as one on each side. A grapheme made of several
// code points counts as several on both sides.

const TEXT_LIMIT = 255;
const DESCRIPTION_LIMIT = 5000;
const INSTRUCTION_LIMIT = 2000;
const LIST_LIMIT = 50;

export { DESCRIPTION_LIMIT, INSTRUCTION_LIMIT, LIST_LIMIT, TEXT_LIMIT };
