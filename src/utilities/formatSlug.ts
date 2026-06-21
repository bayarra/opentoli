const combiningMarks = /[\u0300-\u036f]/g
const nonSlugCharacters = /[^a-z0-9]+/g

export const formatSlug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(combiningMarks, '')
    .toLowerCase()
    .trim()
    .replace(nonSlugCharacters, '-')
    .replace(/^-+|-+$/g, '')
