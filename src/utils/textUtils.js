/**
 * Remove diacritical marks (dấu) từ tiếng Việt
 * Ví dụ: "Hải Châu" -> "Hai Chau", "tèo" -> "teo"
 */
export const removeDiacritics = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD') // Tách dấu khỏi chữ
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/đ/g, 'd') // Xử lý ký tự đặc biệt
    .replace(/Đ/g, 'D');
};

/**
 * Normalize string để dùng cho tìm kiếm
 * - Remove diacritics
 * - Convert sang lowercase
 * - Trim spaces
 */
export const normalizeSearchText = (text) => {
  return removeDiacritics(text).toLowerCase().trim();
};

/**
 * Check xem haystack có chứa needle không (không phân biệt dấu, chữ hoa/thường)
 */
export const includesIgnoreDiacritics = (haystack, needle) => {
  if (!haystack || !needle) return false;
  return normalizeSearchText(haystack).includes(normalizeSearchText(needle));
};
