import React, { useMemo, Suspense } from 'react';
import { ChartJSWrapper, ChartJSLoadingFallback } from '@/components/lazy';

// Lazy load react-chartjs-2 components
const Bar = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Line = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Pie = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const Doughnut = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));
const Radar = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Radar })));
const Scatter = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Scatter })));

// Lazy load and register Chart.js components
const ChartJSSetup = React.lazy(() => 
  Promise.all([
    import('chart.js'),
    import('chart.js/auto')
  ]).then(([chartjsModule, autoModule]) => {
    const {
      Chart: ChartJS,
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      Title,
      Tooltip,
      Legend,
      ArcElement,
      RadialLinearScale,
      Filler
    } = chartjsModule;

    // Register Chart.js components
    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      Title,
      Tooltip,
      Legend,
      ArcElement,
      RadialLinearScale,
      Filler
    );

    return { default: () => null }; // Return empty component since we just needed to register
  })
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Download, Maximize2, Settings, TrendingUp, BarChart3, PieChart, LineChart, Radar as RadarIcon } from 'lucide-react';
import { AnimatedButton } from './ui/AnimatedButton.jsx';
import { useAnalytics } from './Analytics.jsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const DataChart = ({ 
  data, 
  columns = [], 
  title = "Data Visualization",
  className = "",
  onExport = null,
  theme = 'light'
}) => {
  const [selectedColumn, setSelectedColumn] = React.useState('');
  const [chartType, setChartType] = React.useState('bar');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { trackEvent } = useAnalytics();

  // Chart type options
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
    { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: PieChart, description: 'Modern pie chart variant' },
    { value: 'radar', label: 'Radar Chart', icon: RadarIcon, description: 'Compare multiple metrics' },
    { value: 'scatter', label: 'Scatter Plot', icon: TrendingUp, description: 'Show correlations' }
  ];

  // Filter numeric columns for charts
  const numericColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return columns.filter(col => {
      const sample = data.slice(0, 10).map(row => row[col]);
      return sample.some(val => !isNaN(Number(val)) && val !== '' && val !== null);
    });
  }, [data, columns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedColumn || !data || data.length === 0) return null;

    const colData = data.map(row => {
      const value = row[selectedColumn];
      return isNaN(Number(value)) ? 0 : Number(value);
    }).filter(val => !isNaN(val));

    const labels = data.map((_, index) => `Row ${index + 1}`).slice(0, colData.length);

    // Color schemes based on theme
    const colorSchemes = {
      light: {
        primary: 'rgba(59, 130, 246, 0.8)',
        secondary: 'rgba(16, 185, 129, 0.8)',
        accent: 'rgba(245, 158, 11, 0.8)',
        danger: 'rgba(239, 68, 68, 0.8)',
        purple: 'rgba(147, 51, 234, 0.8)',
        background: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 1)'
      },
      dark: {
        primary: 'rgba(96, 165, 250, 0.8)',
        secondary: 'rgba(52, 211, 153, 0.8)',
        accent: 'rgba(251, 191, 36, 0.8)',
        danger: 'rgba(248, 113, 113, 0.8)',
        purple: 'rgba(168, 85, 247, 0.8)',
        background: 'rgba(96, 165, 250, 0.1)',
        border: 'rgba(96, 165, 250, 1)'
      }
    };

    const colors = colorSchemes[theme] || colorSchemes.light;

    // Generate multiple colors for pie/doughnut charts
    const multiColors = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.danger,
      colors.purple,
      'rgba(168, 162, 158, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(6, 182, 212, 0.8)'
    ];

    const baseConfig = {
      labels,
      datasets: [{
        label: selectedColumn,
        data: colData,
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
          ? multiColors.slice(0, colData.length)
          : colors.primary,
        borderColor: chartType === 'pie' || chartType === 'doughnut'
          ? multiColors.slice(0, colData.length).map(color => color.replace('0.8', '1'))
          : colors.border,
        borderWidth: 2,
        fill: chartType === 'line' ? colors.background : false,
        tension: chartType === 'line' ? 0.4 : 0,
        pointBackgroundColor: colors.border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: chartType === 'line' ? 6 : 0
      }]
    };

    return baseConfig;
  }, [selectedColumn, data, chartType, theme]);

  // Chart options
  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: theme === 'dark' ? '#e5e7eb' : '#374151',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: `${selectedColumn} - ${chartTypes.find(t => t.value === chartType)?.label}`,
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          titleColor: theme === 'dark' ? '#f9fafb' : '#111827',
          bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      scales: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar' ? {} : {
        x: {
          ticks: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 11
            }
          },
          grid: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6'
          }
        },
        y: {
          ticks: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 11
            }
          },
          grid: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6'
          }
        }
      }
    };

    return baseOptions;
  }, [selectedColumn, chartType, theme]);

  // Handle column selection
  const handleColumnSelect = (column) => {
    setSelectedColumn(column);
    trackEvent('chart_column_selected', { column, chartType });
  };

  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
    trackEvent('chart_type_changed', { type, column: selectedColumn });
  };

  // Handle export
  const handleExport = () => {
    trackEvent('chart_exported', { chartType, column: selectedColumn });
    onExport && onExport({ chartType, column: selectedColumn, data: chartData });
  };

  // Render chart component
  const renderChart = () => {
    if (!chartData) return null;

    const chartProps = {
      data: chartData,
      options: chartOptions,
      height: isFullscreen ? 500 : 300
    };

    const ChartComponent = () => {
      switch (chartType) {
        case 'bar':
          return <Bar {...chartProps} />;
        case 'line':
          return <Line {...chartProps} />;
        case 'pie':
          return <Pie {...chartProps} />;
        case 'doughnut':
          return <Doughnut {...chartProps} />;
        case 'radar':
          return <Radar {...chartProps} />;
        case 'scatter':
          return <Scatter {...chartProps} />;
        default:
          return <Bar {...chartProps} />;
      }
    };

    return (
      <ChartJSWrapper fallback={<ChartJSLoadingFallback />}>
        <ChartJSSetup />
        <ChartComponent />
      </ChartJSWrapper>
    );
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!selectedColumn || !data || data.length === 0) return null;

    const values = data.map(row => Number(row[selectedColumn])).filter(val => !isNaN(val));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { sum, mean, median, min, max, stdDev, count: values.length };
  }, [selectedColumn, data]);

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>No data available for visualization</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              Interactive data visualization with multiple chart types
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <AnimatedButton
                variant="outline"
                size="sm"
                animation="pulse"
                onClick={handleExport}
                disabled={!selectedColumn}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </AnimatedButton>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Column</label>
            <Select value={selectedColumn} onValueChange={handleColumnSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a numeric column to visualize" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Type</label>
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        {selectedColumn && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              {renderChart()}
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Count</div>
                  <Badge variant="secondary">{statistics.count}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Mean</div>
                  <Badge variant="secondary">{statistics.mean.toFixed(2)}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Median</div>
                  <Badge variant="secondary">{statistics.median.toFixed(2)}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Min</div>
                  <Badge variant="secondary">{statistics.min}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Max</div>
                  <Badge variant="secondary">{statistics.max}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Std Dev</div>
                  <Badge variant="secondary">{statistics.stdDev.toFixed(2)}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Sum</div>
                  <Badge variant="secondary">{statistics.sum.toFixed(0)}</Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedColumn && numericColumns.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a numeric column above to start visualizing your data</p>
          </div>
        )}

        {numericColumns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No numeric columns found in your data</p>
            <p className="text-sm">Charts require numeric data to visualize</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataChart;
