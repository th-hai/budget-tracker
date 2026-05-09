import { EXPENSE_CATEGORIES } from '@/lib/categories';

interface CategoryPickerProps {
  selected: string;
  onSelect: (key: string) => void;
}

export default function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {EXPENSE_CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-bold border-3 transition-all ${
              isSelected
                ? 'border-nero shadow-brutal scale-105'
                : 'border-nero/20 hover:border-nero hover:shadow-brutal-sm'
            }`}
            style={{ backgroundColor: cat.color }}
          >
            <span className="text-lg">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
