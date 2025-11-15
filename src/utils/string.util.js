/**
 * Capitalize first letter of each word
 * @param {string} str - The string to capitalize
 * @returns {string} - Capitalized string
 */
const toTitleCase = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Normalize product name for storage (lowercase, trimmed)
 * @param {string} name - Product name
 * @returns {string} - Normalized name
 */
const normalizeProductName = (name) => {
  if (!name) return name;
  return name.trim().toLowerCase();
};

/**
 * Format product name for display (Title Case)
 * @param {string} name - Product name from database
 * @returns {string} - Formatted name
 */
const formatProductName = (name) => {
  if (!name) return name;
  return toTitleCase(name);
};

module.exports = {
  toTitleCase,
  normalizeProductName,
  formatProductName,
};