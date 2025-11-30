/**
 * 住所から町域名を抽出する
 * 例: "千葉県流山市西初石1-2-3" → "西初石"
 * 例: "東京都渋谷区神宮前1-2-3" → "神宮前"
 */
export const extractTownName = (address?: string): string => {
  if (!address) return '';
  
  // 市区町村郡の後、数字・丁・番の前までを抽出
  // 対応パターン: 市、区、町、村、郡
  const match = address.match(/[市区町村郡]([^\d０-９丁番]+)/);
  
  if (match && match[1]) {
    // 余分な空白を除去して返す
    return match[1].trim();
  }
  
  return '';
};
