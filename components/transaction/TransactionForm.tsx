import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CategoryPicker from './CategoryPicker';
import { postAPI } from '@/lib/api';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      await postAPI('/api/transactions', {
        type,
        amount: Number(amount) * 1000,
        category: type === 'income' ? 'income' : category,
        note,
        transactionDate: new Date(date).toISOString(),
      });
      setAmount('');
      setNote('');
      setCategory('food');
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle */}
      <div className="flex border-3 border-nero rounded-xl overflow-hidden" style={{ boxShadow: '2px 2px 0 #1a1a1a' }}>
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            type === 'expense' ? 'bg-coral text-white' : 'bg-cream'
          }`}
        >
          Chi tieu
        </button>
        <div className="w-[3px] bg-nero" />
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${
            type === 'income' ? 'bg-teal text-nero' : 'bg-cream'
          }`}
        >
          Thu nhap
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="text-sm font-bold uppercase tracking-wide mb-1 block">
          So tien (nghin dong)
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="input-brutal text-2xl font-bold text-center !py-3"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-nero/40 text-lg font-bold">
            k
          </span>
        </div>
        {amount && (
          <p className="text-xs font-semibold mt-1 text-center opacity-50">
            = {(Number(amount) * 1000).toLocaleString('vi-VN')}d
          </p>
        )}
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 flex-wrap">
        {[20, 30, 50, 100, 200, 500].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${
              amount === String(v)
                ? 'border-nero bg-yolk shadow-brutal-sm'
                : 'border-nero/30 hover:border-nero hover:shadow-brutal-sm'
            }`}
          >
            {v}k
          </button>
        ))}
      </div>

      {/* Category */}
      {type === 'expense' && (
        <div>
          <label className="text-sm font-bold uppercase tracking-wide mb-2 block">
            Danh muc
          </label>
          <CategoryPicker selected={category} onSelect={setCategory} />
        </div>
      )}

      {/* Note */}
      <Input
        label="Ghi chu"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nhap ghi chu..."
      />

      {/* Date */}
      <Input
        label="Ngay"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Submit */}
      <Button
        type="submit"
        variant="teal"
        size="lg"
        className="w-full"
        disabled={loading || !amount || Number(amount) <= 0}
      >
        {loading ? 'Dang luu...' : 'Luu giao dich'}
      </Button>
    </form>
  );
}
