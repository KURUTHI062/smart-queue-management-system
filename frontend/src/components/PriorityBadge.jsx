import React from 'react';
import { AlertCircle, Zap, Clock, ShieldCheck } from 'lucide-react';

const PriorityBadge = ({ priority, showIcon = true, size = 'md' }) => {
  const p = Number(priority) || 4;

  const config = {
    1: {
      label: 'Emergency (P1)',
      bg: 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20 shadow-sm animate-pulse',
      icon: AlertCircle,
      dot: 'bg-red-500'
    },
    2: {
      label: 'High (P2)',
      bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-orange-500/10 shadow-sm',
      icon: Zap,
      dot: 'bg-orange-500'
    },
    3: {
      label: 'Medium (P3)',
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10 shadow-sm',
      icon: Clock,
      dot: 'bg-amber-500'
    },
    4: {
      label: 'Normal (P4)',
      bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: ShieldCheck,
      dot: 'bg-sky-500'
    }
  };

  const item = config[p] || config[4];
  const Icon = item.icon;

  const sizeClass = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : size === 'lg' 
      ? 'text-sm px-3.5 py-1.5 gap-2 font-semibold' 
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border ${item.bg} ${sizeClass}`}>
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{item.label}</span>
    </span>
  );
};

export default PriorityBadge;
