// Twelve cards fill the recipe grid: one column on a phone, two from sm, three from lg.
const RECIPE_PAGE_SIZE = 12;

// Page 100 skips 1,188 rows. A larger page param is rejected instead of scanned.
const MAX_RECIPE_PAGE = 100;

const MAX_RECIPE_OFFSET = (MAX_RECIPE_PAGE - 1) * RECIPE_PAGE_SIZE;

type RecipeListPath = "/recipes" | "/cookbook" | "/bookmarks";

type ParsedRecipePage =
  | { status: "page"; page: number }
  | { status: "invalid" }
  | { status: "over-limit" };

type RecipeListView =
  | { status: "empty" }
  | { status: "out-of-range"; total: number; totalPages: number }
  | { status: "results"; page: number; total: number; totalPages: number };

const readRecipePage = (
  value: string | string[] | undefined,
): ParsedRecipePage => {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === undefined || raw === "") {
    return { status: "page", page: 1 };
  }

  if (!/^[1-9]\d*$/.test(raw)) {
    return { status: "invalid" };
  }

  const page = Number(raw);

  if (!Number.isSafeInteger(page)) {
    return { status: "invalid" };
  }

  if (page > MAX_RECIPE_PAGE) {
    return { status: "over-limit" };
  }

  return { status: "page", page };
};

const recipeQueryBounds = (page: number) => {
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_RECIPE_PAGE) {
    return null;
  }

  return {
    limit: RECIPE_PAGE_SIZE,
    offset: (page - 1) * RECIPE_PAGE_SIZE,
  };
};

const recipeListHref = (
  pathname: RecipeListPath,
  query: string,
  page: number,
) => {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
};

const recipePageRedirectHref = (
  pathname: RecipeListPath,
  query: string,
  page: ParsedRecipePage,
) => {
  if (page.status !== "invalid") {
    return null;
  }

  return recipeListHref(pathname, query, 1);
};

const recipeSearchHref = (
  pathname: string,
  current: URLSearchParams,
  term: string,
) => {
  const params = new URLSearchParams(current);

  if (term) {
    params.set("q", term);
  } else {
    params.delete("q");
  }

  params.delete("page");

  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
};

const recipeTotalPages = (total: number) => {
  if (!Number.isSafeInteger(total) || total <= 0) {
    return 0;
  }

  return Math.ceil(total / RECIPE_PAGE_SIZE);
};

const recipeListView = (
  total: number,
  requested: ParsedRecipePage,
): RecipeListView => {
  const safeTotal = Number.isSafeInteger(total) && total > 0 ? total : 0;

  if (safeTotal === 0) {
    return { status: "empty" };
  }

  const totalPages = recipeTotalPages(safeTotal);

  if (requested.status !== "page" || requested.page > totalPages) {
    return { status: "out-of-range", total: safeTotal, totalPages };
  }

  return {
    status: "results",
    page: requested.page,
    total: safeTotal,
    totalPages,
  };
};

const recipeCountLabel = (total: number) => {
  return total === 1 ? "1 recipe" : `${total} recipes`;
};

export {
  MAX_RECIPE_OFFSET,
  MAX_RECIPE_PAGE,
  readRecipePage,
  RECIPE_PAGE_SIZE,
  recipeCountLabel,
  recipeListHref,
  recipeListView,
  recipePageRedirectHref,
  recipeQueryBounds,
  recipeSearchHref,
  recipeTotalPages,
};
export type { ParsedRecipePage, RecipeListPath, RecipeListView };
