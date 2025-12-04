/**
 * 住所から町域名を抽出する
 * 例: "千葉県流山市西初石1-2-3" → "西初石"
 * 例: "東京都渋谷区神宮前1-2-3" → "神宮前"
 * 例: "東京都中央区3-3-3" → "中央区" (町域名がない場合は区名を返す)
 * 例: "270-0034 千葉県松戸市新松戸3-296" → "新松戸"
 */
export const extractTownName = (address?: string): string => {
  if (!address) return '';
  
  // まず町域名を抽出（市区町村郡の後、数字・丁・番の前まで）
  const townMatch = address.match(/[市区町村郡]([^\d０-９丁番]+)/);
  
  if (townMatch && townMatch[1]) {
    // 余分な空白を除去して返す
    return townMatch[1].trim();
  }
  
  // 町域名がない場合（例: "東京都中央区3-3-3"）、区名を返す
  const districtMatch = address.match(/([^都道府県]+[市区町村郡])/);
  if (districtMatch && districtMatch[1]) {
    // 最後の市区町村郡のみを抽出（例: "松戸市" → "松戸市", "中央区" → "中央区"）
    const lastDistrict = districtMatch[1].match(/([^市区町村郡]+[市区町村郡])$/);
    if (lastDistrict) {
      return lastDistrict[1];
    }
  }
  
  return '';
};
