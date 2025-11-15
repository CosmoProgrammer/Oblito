// Simple in-memory store for category mappings
let categoryMap: Record<string, string> = {};

export function setCategoryMap(categories: any[]) {
  categoryMap = {};
  categories.forEach(category => {
    categoryMap[category.id] = category.name;
  });
}

export function getCategoryName(categoryId: string): string {
  return categoryMap[categoryId] || 'Unknown Category';
}

export function getCategoryMap() {
  return categoryMap;
}
