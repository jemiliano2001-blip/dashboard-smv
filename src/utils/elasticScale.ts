import { ACCESSIBILITY } from './constants'

export interface ElasticScale {
  scaleFactor: number // 0.7 to 2.0
  poNumberSize: string // 'text-2xl' to 'text-5xl'
  quantitySize: string // 'text-xl' to 'text-4xl'
  partNameSize: string // 'text-xs' to 'text-lg'
  metaSize: string // 'text-[10px]' to 'text-sm'
  paddingX: string // 'px-2' to 'px-6'
  paddingY: string // 'py-1' to 'py-4'
  gap: string // 'gap-2' to 'gap-4'
}

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Calculate elastic scale based on order count and breakpoint
 */
export function calculateElasticScale(
  orderCount: number,
  _maxOrders: number = 20,
  breakpoint?: Breakpoint
): ElasticScale {
  let scaleFactor: number

  // Determine base scale factor based on order count
  if (orderCount <= 3) {
    scaleFactor = 2.0 // huge
  } else if (orderCount <= 5) {
    scaleFactor = 1.5 // large
  } else if (orderCount <= 12) {
    scaleFactor = 1.0 // normal
  } else if (orderCount <= 16) {
    scaleFactor = 0.8 // compact
  } else {
    scaleFactor = 0.7 // dense
  }

  // Adjust for smaller screens (better readability)
  if (breakpoint === 'sm' || breakpoint === 'md') {
    scaleFactor = Math.max(scaleFactor, 0.8) // Minimum 0.8x on small screens
  }

  // Generate size classes based on scale factor
  const sizes = getSizeClasses(scaleFactor)

  return {
    scaleFactor,
    ...sizes,
  }
}

/**
 * Get Tailwind size classes based on scale factor
 */
function getSizeClasses(scaleFactor: number): Omit<ElasticScale, 'scaleFactor'> {
  // PO Number sizes (largest text)
  const poNumberSizes: Record<number, string> = {
    2.0: 'text-5xl',
    1.5: 'text-4xl',
    1.0: 'text-2xl',
    0.8: 'text-xl',
    0.7: 'text-lg',
  }

  // Quantity sizes
  const quantitySizes: Record<number, string> = {
    2.0: 'text-4xl',
    1.5: 'text-3xl',
    1.0: 'text-xl',
    0.8: 'text-lg',
    0.7: 'text-base',
  }

  // Part name sizes
  const partNameSizes: Record<number, string> = {
    2.0: 'text-lg',
    1.5: 'text-base',
    1.0: 'text-xs',
    0.8: 'text-xs',
    0.7: 'text-xs',
  }

  // Meta sizes (date/status) - ensure minimum 12px for accessibility
  const metaSizes: Record<number, string> = {
    2.0: 'text-sm',
    1.5: 'text-xs',
    1.0: 'text-xs', // Changed from text-[10px] to meet 12px minimum
    0.8: 'text-xs', // Changed from text-[10px] to meet 12px minimum
    0.7: 'text-xs', // Changed from text-[10px] to meet 12px minimum
  }

  // Padding X
  const paddingXSizes: Record<number, string> = {
    2.0: 'px-6',
    1.5: 'px-4',
    1.0: 'px-2',
    0.8: 'px-2',
    0.7: 'px-2',
  }

  // Padding Y
  const paddingYSizes: Record<number, string> = {
    2.0: 'py-4',
    1.5: 'py-3',
    1.0: 'py-0.5',
    0.8: 'py-0.5',
    0.7: 'py-0.5',
  }

  // Gap sizes
  const gapSizes: Record<number, string> = {
    2.0: 'gap-4',
    1.5: 'gap-3',
    1.0: 'gap-2',
    0.8: 'gap-2',
    0.7: 'gap-2',
  }

  // Find closest scale factor key
  const scaleKeys = [2.0, 1.5, 1.0, 0.8, 0.7]
  const closestScale = scaleKeys.reduce((prev, curr) =>
    Math.abs(curr - scaleFactor) < Math.abs(prev - scaleFactor) ? curr : prev
  )

  return {
    poNumberSize: poNumberSizes[closestScale] || 'text-2xl',
    quantitySize: quantitySizes[closestScale] || 'text-xl',
    partNameSize: partNameSizes[closestScale] || 'text-xs',
    metaSize: metaSizes[closestScale] || 'text-[10px]',
    paddingX: paddingXSizes[closestScale] || 'px-2',
    paddingY: paddingYSizes[closestScale] || 'py-1',
    gap: gapSizes[closestScale] || 'gap-2',
  }
}

/**
 * Validate that elastic scale meets accessibility requirements
 */
export function isElasticScaleValid(scale: ElasticScale): boolean {
  // Map Tailwind text sizes to approximate pixel values
  const textSizeMap: Record<string, number> = {
    'text-5xl': 48,
    'text-4xl': 36,
    'text-3xl': 30,
    'text-2xl': 24,
    'text-xl': 20,
    'text-lg': 18,
    'text-base': 16,
    'text-sm': 14,
    'text-xs': 12,
    'text-[10px]': 10,
  }

  // Check if meta size (smallest text) meets minimum requirement
  const metaSizePx = textSizeMap[scale.metaSize] || 10
  const partNameSizePx = textSizeMap[scale.partNameSize] || 12

  // Both meta and part name should be >= 12px for WCAG AA compliance
  return metaSizePx >= ACCESSIBILITY.MIN_FONT_SIZE_PX && partNameSizePx >= ACCESSIBILITY.MIN_FONT_SIZE_PX
}
