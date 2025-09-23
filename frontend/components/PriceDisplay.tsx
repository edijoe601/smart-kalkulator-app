import { Badge } from '@/components/ui/badge';

interface PriceDisplayProps {
  originalPrice?: number;
  sellingPrice: number;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
}

export default function PriceDisplay({ 
  originalPrice, 
  sellingPrice, 
  discountPercent,
  size = 'md',
  showDiscount = true
}: PriceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const hasDiscount = originalPrice && originalPrice > sellingPrice;
  const calculatedDiscount = hasDiscount 
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : discountPercent;

  const sizeClasses = {
    sm: {
      selling: 'text-sm font-semibold',
      original: 'text-xs',
      discount: 'text-xs'
    },
    md: {
      selling: 'text-base font-semibold',
      original: 'text-sm',
      discount: 'text-xs'
    },
    lg: {
      selling: 'text-lg font-bold',
      original: 'text-base',
      discount: 'text-sm'
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Current/Selling Price */}
      <span className={`text-green-600 ${sizeClasses[size].selling}`}>
        {formatCurrency(sellingPrice)}
      </span>

      {/* Original Price with Strikethrough */}
      {hasDiscount && (
        <span className={`text-gray-500 line-through ${sizeClasses[size].original}`}>
          {formatCurrency(originalPrice)}
        </span>
      )}

      {/* Discount Badge */}
      {showDiscount && calculatedDiscount && calculatedDiscount > 0 && (
        <Badge 
          variant="destructive" 
          className={`bg-red-500 text-white ${sizeClasses[size].discount}`}
        >
          -{calculatedDiscount}%
        </Badge>
      )}
    </div>
  );
}