import { catalogueImageUrl } from "@/lib/storage";
import { productsIn, type Catalogue, type ShopCollection } from "@/lib/shop/data";
import type { FolderData } from "@/components/shop/collection-folder";

export function toFolder(catalogue: Catalogue, collection: ShopCollection): FolderData {
  const products = productsIn(catalogue, collection);
  const paths = [
    ...(collection.coverPath ? [collection.coverPath] : []),
    ...products.flatMap((product) => (product.images[0] ? [product.images[0].path] : [])),
  ].slice(0, 10);
  return {
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    count: products.length,
    images: paths.map(catalogueImageUrl),
  };
}
