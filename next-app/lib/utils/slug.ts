export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateReviewSlug(title: string, year?: number | string): string {
  const base = slugify(title);
  if (year && !base.includes(String(year))) {
    return `${base}-${year}`;
  }
  return base;
}
