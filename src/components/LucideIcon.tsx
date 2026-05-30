import React from 'react';
import * as Icons from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const LucideIcon: React.FC<LucideIconProps> = ({ name, className = '', size = 20 }) => {
  // Safe lookup for built-in lucide icons
  const IconComponent = (Icons as any)[name];
  
  if (!IconComponent) {
    // Fallback icon
    return <Icons.HelpCircle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

// Exporting list of curated icon names for users to pick when creating category
export const CURATED_ICONS = [
  'Utensils',
  'Car',
  'Home',
  'HeartPulse',
  'Sparkles',
  'ShoppingBag',
  'GraduationCap',
  'Briefcase',
  'TrendingUp',
  'Receipt',
  'PiggyBank',
  'Tv',
  'Coffee',
  'Plane',
  'Activity',
  'Gift',
  'Clapperboard',
  'Smartphone',
  'Dumbbell',
  'Wrench',
  'ShoppingCart',
  'Heart',
  'Globe',
  'Scissors'
];
