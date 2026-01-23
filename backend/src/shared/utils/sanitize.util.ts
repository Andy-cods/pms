import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize plain text input - removes all HTML tags
 * Use for fields that should not contain any HTML (titles, names, etc.)
 */
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {},
  });
}

/**
 * Sanitize rich text input - allows limited safe HTML tags
 * Use for fields that may contain formatted text (descriptions, comments, etc.)
 */
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
      a: ['href', 'target'],
    },
    allowedSchemes: ['https'],
  });
}
