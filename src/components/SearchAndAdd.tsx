import { useMemo, useState } from 'react';

interface SearchAndAddProps {
  label: string;
  placeholder: string;
  allItems: readonly string[];
  selectedItems: readonly string[];
  onSelectionChange: (newSelection: string[]) => void;
}

function SearchAndAdd({
  label,
  placeholder,
  allItems,
  selectedItems,
  onSelectionChange,
}: SearchAndAddProps) {
  const [query, setQuery] = useState('');

  const handleAddItem = (item: string) => {
    if (!selectedItems.includes(item)) {
      onSelectionChange([...selectedItems, item]);
    }
    setQuery(''); // Clear search input after selection
  };

  const handleRemoveItem = (itemToRemove: string) => {
    onSelectionChange(selectedItems.filter((item) => item !== itemToRemove));
  };

  const filteredItems = useMemo(() => {
    if (!query) return [];
    return allItems
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => !selectedItems.includes(item)) // Don't show already selected items
      .slice(0, 7); // Limit results to avoid a huge list
  }, [query, allItems, selectedItems]);

  return (
    <div>
      <label className="label text-sm font-medium">{label}</label>
      {/* Display selected items as tags */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
        {selectedItems.map((item) => (
          <div key={item} className="badge badge-lg badge-primary gap-2">
            {item}
            <button
              type="button"
              onClick={() => handleRemoveItem(item)}
              className="btn btn-xs btn-circle btn-ghost"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Search Input and Results */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input w-full"
        />
        {query && (
          <ul className="absolute z-10 w-full bg-white border rounded-box mt-1 shadow-lg max-h-60 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="w-full text-left p-2 hover:bg-white"
                  >
                    {item}
                  </button>
                </li>
              ))
            ) : (
              <li className="p-2 text-sm text-gray-500">
                Nenhum resultado encontrado.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SearchAndAdd;
