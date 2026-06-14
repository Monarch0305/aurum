import {
  Utensils,
  Plane,
  ShoppingBag,
  Tv,
  Heart,
  Car,
  CreditCard,
  ArrowLeftRight,
  Zap,
  MoreHorizontal,
  Coffee,
  Landmark,
  Package,
  Dumbbell,
  Wifi,
  Home,
  GraduationCap,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'

interface CategoryData {
  icon: LucideIcon
  color: string
  bg: string
}

const MAP: Record<string, CategoryData> = {
  'Food and Drink': {
    icon: Utensils,
    color: '#e57373',
    bg: 'linear-gradient(145deg, rgba(50,20,20,1), rgba(28,10,10,1))',
  },
  'Restaurants': {
    icon: Utensils,
    color: '#e57373',
    bg: 'linear-gradient(145deg, rgba(50,20,20,1), rgba(28,10,10,1))',
  },
  'Coffee Shop': {
    icon: Coffee,
    color: '#c8956c',
    bg: 'linear-gradient(145deg, rgba(45,28,14,1), rgba(26,15,6,1))',
  },
  'Travel': {
    icon: Plane,
    color: '#64b5f6',
    bg: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,32,1))',
  },
  'Airlines and Aviation Services': {
    icon: Plane,
    color: '#64b5f6',
    bg: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,32,1))',
  },
  'Shops': {
    icon: ShoppingBag,
    color: '#ba68c8',
    bg: 'linear-gradient(145deg, rgba(36,16,46,1), rgba(20,8,28,1))',
  },
  'Shopping': {
    icon: ShoppingBag,
    color: '#ba68c8',
    bg: 'linear-gradient(145deg, rgba(36,16,46,1), rgba(20,8,28,1))',
  },
  'Entertainment': {
    icon: Tv,
    color: '#ff8a65',
    bg: 'linear-gradient(145deg, rgba(50,26,14,1), rgba(28,14,6,1))',
  },
  'Healthcare': {
    icon: Stethoscope,
    color: '#ef5350',
    bg: 'linear-gradient(145deg, rgba(48,14,14,1), rgba(28,8,8,1))',
  },
  'Medical': {
    icon: Heart,
    color: '#ef5350',
    bg: 'linear-gradient(145deg, rgba(48,14,14,1), rgba(28,8,8,1))',
  },
  'Transportation': {
    icon: Car,
    color: '#4db6ac',
    bg: 'linear-gradient(145deg, rgba(10,36,34,1), rgba(6,20,18,1))',
  },
  'Automotive': {
    icon: Car,
    color: '#4db6ac',
    bg: 'linear-gradient(145deg, rgba(10,36,34,1), rgba(6,20,18,1))',
  },
  'Payment': {
    icon: CreditCard,
    color: '#D4AF37',
    bg: 'linear-gradient(145deg, rgba(40,32,10,1), rgba(22,17,4,1))',
  },
  'Transfer': {
    icon: ArrowLeftRight,
    color: '#D4AF37',
    bg: 'linear-gradient(145deg, rgba(40,32,10,1), rgba(22,17,4,1))',
  },
  'Utilities': {
    icon: Zap,
    color: '#FFF176',
    bg: 'linear-gradient(145deg, rgba(40,38,10,1), rgba(22,20,4,1))',
  },
  'Electric': {
    icon: Zap,
    color: '#FFF176',
    bg: 'linear-gradient(145deg, rgba(40,38,10,1), rgba(22,20,4,1))',
  },
  'Bank Fees': {
    icon: Landmark,
    color: 'rgba(240,236,226,0.6)',
    bg: 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
  },
  'Gyms and Fitness Centers': {
    icon: Dumbbell,
    color: '#81c784',
    bg: 'linear-gradient(145deg, rgba(14,34,16,1), rgba(8,20,10,1))',
  },
  'Subscription': {
    icon: Package,
    color: '#b0bec5',
    bg: 'linear-gradient(145deg, rgba(22,26,30,1), rgba(12,14,16,1))',
  },
  'Internet': {
    icon: Wifi,
    color: '#64b5f6',
    bg: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,32,1))',
  },
  'Rent': {
    icon: Home,
    color: '#a5d6a7',
    bg: 'linear-gradient(145deg, rgba(14,34,16,1), rgba(8,20,10,1))',
  },
  'Education': {
    icon: GraduationCap,
    color: '#90caf9',
    bg: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,32,1))',
  },
}

const FALLBACK: CategoryData = {
  icon: MoreHorizontal,
  color: 'rgba(240,236,226,0.45)',
  bg: 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
}

export function getCategoryData(category: string | null | undefined): CategoryData {
  if (!category) return FALLBACK
  if (MAP[category]) return MAP[category]

  // Fuzzy match — Plaid categories can be hierarchical ("Food and Drink > Restaurants")
  const key = Object.keys(MAP).find(
    (k) =>
      category.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(category.toLowerCase())
  )
  return key ? MAP[key] : FALLBACK
}

// Ordered palette for category breakdown list (index-based coloring)
export const CATEGORY_PALETTE = [
  '#D4AF37',
  '#81c784',
  '#64b5f6',
  '#ba68c8',
  '#ff8a65',
  '#4db6ac',
]
