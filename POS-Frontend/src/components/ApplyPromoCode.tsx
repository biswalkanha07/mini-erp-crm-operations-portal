import React, { useState } from 'react';
import axios from 'axios';

interface ApplyPromoResult {
  success: boolean;
  message: string;
  discountAmount?: number;
}

const ApplyPromoCode: React.FC<{ orderTotal: number; onDiscount: (discount: number) => void }> = ({ orderTotal, onDiscount }) => {
  const [promoCode, setPromoCode] = useState('');
  const [result, setResult] = useState<ApplyPromoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/promo-codes/apply', { code: promoCode, orderTotal });
      setResult({ success: true, message: 'Promo code applied!', discountAmount: res.data.discountAmount });
      onDiscount(res.data.discountAmount);
    } catch (err: any) {
      setResult({ success: false, message: err.response?.data?.message || 'Invalid promo code' });
      onDiscount(0);
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: '1em 0' }}>
      <input
        type="text"
        placeholder="Enter promo code"
        value={promoCode}
        onChange={e => setPromoCode(e.target.value)}
        disabled={loading}
      />
      <button onClick={handleApply} disabled={loading || !promoCode}>Apply</button>
      {result && (
        <div style={{ color: result.success ? 'green' : 'red' }}>{result.message}{result.discountAmount ? ` (-₹${result.discountAmount})` : ''}</div>
      )}
    </div>
  );
};

export default ApplyPromoCode;
