/** Client/server shapes for catalog categories. */

export type ItemCategory = {
  id: string;
  name: string;
};

/** Runtime marker so the module is never an empty client export. */
export const ITEM_CATEGORY_NAME_MAX = 40;
