"use client";

import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/(server)/actions/cms/content";
import { TaxonomyManager, type TaxonomyItem } from "../../../_components/taxonomy-manager";

export function CategoriesManager({ categories }: { categories: Array<Record<string, unknown>> }) {
  const items = categories as unknown as TaxonomyItem[];

  return (
    <TaxonomyManager
      kind="category"
      title="Kategorije"
      description="Organizuj blog objave po kategorijama."
      items={items}
      showColor
      createItem={(data) => createCategoryAction(data as any)}
      updateItem={(id, data) => updateCategoryAction(id, data as any)}
      deleteItem={deleteCategoryAction}
    />
  );
}
