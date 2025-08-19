// Comprehensive lazy loading exports for all chart libraries
export * from './RechartsLazy'
export * from './ChartJSLazy'

// Re-export with prefixes for clarity
export { 
  LazyRechartsWrapper as RechartsWrapper,
  ChartLoadingFallback as RechartsLoadingFallback,
  ChartErrorFallback as RechartsErrorFallback
} from './RechartsLazy'

export {
  LazyChartJSWrapper as ChartJSWrapper, 
  LazyChart,
  ChartJSLoadingFallback,
  ChartJSErrorFallback
} from './ChartJSLazy'

// Convenience exports
import RechartsLazy from './RechartsLazy'
import ChartJSLazy from './ChartJSLazy'

export const Charts = {
  Recharts: RechartsLazy,
  ChartJS: ChartJSLazy
}
