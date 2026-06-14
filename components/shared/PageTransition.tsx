'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

/**
 * Wrap each protected page's content in a fade + slide-up entry.
 * Uses pathname as the Framer Motion key so the animation re-fires on every navigation.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <motion.div
      key={path}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}
