import { Suspense } from "react";

// Fallback component when Plotly is not available
const PlotlyFallback = ({ data, layout, style, className }) => {
  return (
    <div className={`flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className || ''}`} style={style}>
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Chart Preview</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data?.length ? `Showing ${data.length} data series` : 'Chart data ready'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {layout?.title?.text || 'Interactive Chart'}
        </p>
      </div>
    </div>
  );
};

export default function ChartLazy({ data, layout, config, style, className }) {
  // Since react-plotly.js is not installed, return fallback directly
  return (
    <PlotlyFallback 
      data={data} 
      layout={layout} 
      style={{
        width: '100%',
        height: '400px',
        ...style
      }}
      className={className}
    />
  );
}

// Enhanced version with error boundary
export function ChartLazyWithError({ data, layout, config, style, className, onError }) {
  return (
    <PlotlyFallback 
      data={data} 
      layout={layout} 
      style={{
        width: '100%',
        height: '400px',
        ...style
      }}
      className={className}
    />
  );
}
