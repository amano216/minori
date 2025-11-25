export function OfficeSwitcher() {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-500">事業所:</span>
      <select className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="1">本社</option>
        <option value="2">新宿事業所</option>
        <option value="3">渋谷事業所</option>
        <option value="4">池袋事業所</option>
      </select>
    </div>
  );
}
