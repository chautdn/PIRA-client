/**
 * Category Translation Mapping
 * Maps Vietnamese category names to English
 */

export const categoryTranslations = {
  // Main Categories
  'Phương tiện di chuyển': 'Vehicles',
  'Thiết bị công nghệ du lịch': 'Travel Technology Equipment',
  'Dụng cụ an toàn & Cứu hộ': 'Safety & Rescue Equipment',
  'Đèn pin & Thiết bị chiếu sáng': 'Flashlights & Lighting Equipment',
  'Thiết bị nấu ăn ngoài trời': 'Outdoor Cooking Equipment',
  'Thiết bị nâu ăn ngoài trời': 'Outdoor Cooking Equipment',
  'Ba lô & Túi du lịch': 'Backpacks & Travel Bags',
  'Lều & Dụng cụ cắm trại': 'Tents & Camping Gear',
  'Khác': 'Other',
  
  // Sub Categories - Vehicles
  'Xe máy du lịch': 'Travel Motorcycles',
  'Xe đạp địa hình': 'Mountain Bikes',
  'Kayak & SUP': 'Kayak & SUP',
  'Vận truyết & Patin': 'Skates & Skateboard',
  
  // Sub Categories - Travel Technology
  'Máy ảnh & GoPro': 'Cameras & GoPro',
  'Flycam & Drone': 'Drones & Flycams',
  'Thiết bị điện tử khác': 'Other Electronic Equipment',
  
  // Sub Categories - Safety & Rescue
  'Bộ sơ cứu': 'First Aid Kit',
  'Dao đa năng & Dụng cụ sinh tồn': 'Multi-tools & Survival Tools',
  'Dao da nâng & Dụng cụ sinh tồn': 'Multi-tools & Survival Tools',
  'Trang bị leo núi': 'Climbing Equipment',
  
  // Sub Categories - Lighting
  'Đèn đội đầu': 'Headlamps',
  'Đèn lều': 'Tent Lights',
  'Đèn pin cầm tay': 'Handheld Flashlights',
  'Đèn pin cắm tay': 'Handheld Flashlights',
  
  // Sub Categories - Outdoor Cooking
  'Bếp & Nhiên liệu': 'Stoves & Fuel',
  'Bình nước & Bình giữ nhiệt': 'Water Bottles & Thermos',
  'Bộ nồi & Dụng cụ ăn uống': 'Cookware & Utensils',
  
  // Sub Categories - Tents & Camping
  'Lều gia đình': 'Family Tents',
  'Túi ngủ & Tấm trải': 'Sleeping Bags & Mats',
  'Ghế & Bàn gấp': 'Folding Chairs & Tables',
  'Lều cắm trại 2 người': '2-Person Camping Tent',
  
  // Sub Categories - Backpacks & Bags
  'Túi chống nước': 'Waterproof Bags',
  'Ba lô leo núi': 'Hiking Backpacks',
  'Vận truyết & Patin': 'Skates & Skateboard',
};

export const subCategoryTranslations = {
  // All subcategories mapped for easy lookup
  'Xe máy du lịch': 'Travel Motorcycles',
  'Xe đạp địa hình': 'Mountain Bikes',
  'Kayak & SUP': 'Kayak & SUP',
  'Vận truyết & Patin': 'Skates & Skateboard',
  'Máy ảnh & GoPro': 'Cameras & GoPro',
  'Flycam & Drone': 'Drones & Flycams',
  'Thiết bị điện tử khác': 'Other Electronic Equipment',
  'Bộ sơ cứu': 'First Aid Kit',
  'Dao đa năng & Dụng cụ sinh tồn': 'Multi-tools & Survival Tools',
  'Dao da nâng & Dụng cụ sinh tồn': 'Multi-tools & Survival Tools',
  'Trang bị leo núi': 'Climbing Equipment',
  'Đèn đội đầu': 'Headlamps',
  'Đèn lều': 'Tent Lights',
  'Đèn pin cầm tay': 'Handheld Flashlights',
  'Đèn pin cắm tay': 'Handheld Flashlights',
  'Bếp & Nhiên liệu': 'Stoves & Fuel',
  'Bình nước & Bình giữ nhiệt': 'Water Bottles & Thermos',
  'Bộ nồi & Dụng cụ ăn uống': 'Cookware & Utensils',
  'Lều gia đình': 'Family Tents',
  'Túi ngủ & Tấm trải': 'Sleeping Bags & Mats',
  'Ghế & Bàn gấp': 'Folding Chairs & Tables',
  'Lều cắm trại 2 người': '2-Person Camping Tent',
  'Túi chống nước': 'Waterproof Bags',
  'Ba lô leo núi': 'Hiking Backpacks',
  'Khác': 'Other',
};

/**
 * Translate category name based on current language
 * @param {string} vietnameseName - Vietnamese category name
 * @param {string} language - Current language (vi, en)
 * @returns {string} Translated name or original if not found
 */
export const translateCategory = (vietnameseName, language = 'vi') => {
  if (language === 'vi') {
    return vietnameseName;
  }
  return categoryTranslations[vietnameseName] || vietnameseName;
};

/**
 * Translate subcategory name based on current language
 * @param {string} vietnameseName - Vietnamese subcategory name
 * @param {string} language - Current language (vi, en)
 * @returns {string} Translated name or original if not found
 */
export const translateSubCategory = (vietnameseName, language = 'vi') => {
  if (language === 'vi') {
    return vietnameseName;
  }
  return subCategoryTranslations[vietnameseName] || vietnameseName;
};
