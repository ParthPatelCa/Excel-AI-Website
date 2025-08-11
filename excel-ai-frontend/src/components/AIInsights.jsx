import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  FileSpreadsheet, 
  Calculator,
  Lightbulb,
  BarChart3,
  PieChart,
  Copy,
  CheckCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AnimatedButton } from './ui/AnimatedButton.jsx';
import { CopyButton } from './ui/CopyButton.jsx';
import { useAnalytics } from './Analytics.jsx';

const AIInsights = ({ 
  data, 
  columns = [], 
  insights = null, 
  className = "",
  onRegenerateInsights = null,
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const { trackEvent } = useAnalytics();

  // Calculate data statistics
  const dataStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const stats = {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns: [],
      textColumns: [],
      emptyValues: 0,
      duplicateRows: 0
    };

    // Analyze column types and empty values
    columns.forEach(col => {
      const sample = data.slice(0, 100).map(row => row[col]);
      const numericCount = sample.filter(val => !isNaN(Number(val)) && val !== '' && val !== null).length;
      
      if (numericCount / sample.length > 0.7) {
        stats.numericColumns.push(col);
      } else {
        stats.textColumns.push(col);
      }

      // Count empty values in this column
      const emptyInColumn = data.filter(row => 
        row[col] === '' || row[col] === null || row[col] === undefined
      ).length;
      stats.emptyValues += emptyInColumn;
    });

    // Calculate duplicate rows (simplified check)
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    stats.duplicateRows = data.length - uniqueRows.size;

    return stats;
  }, [data, columns]);

  // Generate automatic insights from data
  const automaticInsights = useMemo(() => {
    if (!data || !dataStats) return [];

    const insights = [];

    // Data quality insights
    if (dataStats.emptyValues > 0) {
      const emptyPercentage = (dataStats.emptyValues / (dataStats.totalRows * dataStats.totalColumns)) * 100;
      insights.push({
        type: 'warning',
        category: 'Data Quality',
        title: 'Missing Data Detected',
        description: `${dataStats.emptyValues} empty values found (${emptyPercentage.toFixed(1)}% of total data)`,
        recommendation: 'Consider cleaning or filling missing values before analysis',
        icon: AlertTriangle
      });
    }

    // Duplicate data insight
    if (dataStats.duplicateRows > 0) {
      insights.push({
        type: 'warning',
        category: 'Data Quality',
        title: 'Duplicate Rows Found',
        description: `${dataStats.duplicateRows} duplicate rows detected`,
        recommendation: 'Remove duplicates to improve data accuracy',
        icon: AlertTriangle
      });
    }

    // Column type insights
    if (dataStats.numericColumns.length > 0) {
      insights.push({
        type: 'success',
        category: 'Data Structure',
        title: 'Numeric Data Available',
        description: `${dataStats.numericColumns.length} numeric columns suitable for mathematical analysis`,
        recommendation: 'Use these columns for calculations, charts, and statistical analysis',
        icon: TrendingUp
      });
    }

    // Size insights
    if (dataStats.totalRows > 1000) {
      insights.push({
        type: 'info',
        category: 'Dataset Size',
        title: 'Large Dataset',
        description: `${dataStats.totalRows.toLocaleString()} rows provide substantial data for analysis`,
        recommendation: 'Consider using pivot tables or aggregations for better performance',
        icon: BarChart3
      });
    }

    // Column diversity
    const columnRatio = dataStats.numericColumns.length / dataStats.totalColumns;
    if (columnRatio > 0.5) {
      insights.push({
        type: 'success',
        category: 'Analysis Potential',
        title: 'High Analysis Potential',
        description: 'Majority of columns are numeric, enabling comprehensive statistical analysis',
        recommendation: 'Ideal for trend analysis, forecasting, and mathematical modeling',
        icon: Target
      });
    }

    return insights;
  }, [data, dataStats]);

  // Generate Excel formulas based on data
  const suggestedFormulas = useMemo(() => {
    if (!dataStats || dataStats.numericColumns.length === 0) return [];

    const formulas = [];
    const firstNumericCol = dataStats.numericColumns[0];
    const range = `A2:A${dataStats.totalRows + 1}`;

    formulas.push({
      category: 'Statistical Analysis',
      formulas: [
        {
          name: 'Average',
          formula: `=AVERAGE(${range})`,
          description: `Calculate the average of ${firstNumericCol}`,
          useCase: 'Find the central tendency of your data'
        },
        {
          name: 'Standard Deviation',
          formula: `=STDEV(${range})`,
          description: `Measure variability in ${firstNumericCol}`,
          useCase: 'Understand data spread and consistency'
        },
        {
          name: 'Maximum Value',
          formula: `=MAX(${range})`,
          description: `Find the highest value in ${firstNumericCol}`,
          useCase: 'Identify peak performance or outliers'
        },
        {
          name: 'Minimum Value',
          formula: `=MIN(${range})`,
          description: `Find the lowest value in ${firstNumericCol}`,
          useCase: 'Identify minimum requirements or limits'
        }
      ]
    });

    if (dataStats.numericColumns.length >= 2) {
      const secondNumericCol = dataStats.numericColumns[1];
      const rangeB = `B2:B${dataStats.totalRows + 1}`;

      formulas.push({
        category: 'Comparative Analysis',
        formulas: [
          {
            name: 'Correlation',
            formula: `=CORREL(${range},${rangeB})`,
            description: `Correlation between ${firstNumericCol} and ${secondNumericCol}`,
            useCase: 'Understand relationships between variables'
          },
          {
            name: 'Ratio Analysis',
            formula: `=${range}/${rangeB}`,
            description: `Ratio of ${firstNumericCol} to ${secondNumericCol}`,
            useCase: 'Calculate efficiency metrics or percentages'
          }
        ]
      });
    }

    formulas.push({
      category: 'Data Validation',
      formulas: [
        {
          name: 'Count Non-Empty',
          formula: `=COUNTA(${range})`,
          description: 'Count non-empty cells',
          useCase: 'Data quality assessment'
        },
        {
          name: 'Count Unique Values',
          formula: `=SUMPRODUCT(1/COUNTIF(${range},${range}))`,
          description: 'Count unique values in range',
          useCase: 'Identify data diversity'
        }
      ]
    });

    return formulas;
  }, [dataStats]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    trackEvent('ai_insights_tab_changed', { tab });
  };

  // Handle regenerate insights
  const handleRegenerateInsights = () => {
    trackEvent('ai_insights_regenerated');
    onRegenerateInsights && onRegenerateInsights();
  };

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Insights
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Enhanced
              </Badge>
            </CardTitle>
            <CardDescription>
              Intelligent analysis of your data with actionable recommendations
            </CardDescription>
          </div>
          {onRegenerateInsights && (
            <AnimatedButton
              variant="outline"
              size="sm"
              animation="pulse"
              onClick={handleRegenerateInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyzing...' : 'Regenerate'}
            </AnimatedButton>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="formulas" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Formulas
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dataStats?.totalRows.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600/70 dark:text-blue-400/70">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dataStats?.totalColumns}
                </div>
                <div className="text-sm text-green-600/70 dark:text-green-400/70">Columns</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {dataStats?.numericColumns.length}
                </div>
                <div className="text-sm text-purple-600/70 dark:text-purple-400/70">Numeric</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {((1 - (dataStats?.emptyValues / (dataStats?.totalRows * dataStats?.totalColumns))) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600/70 dark:text-orange-400/70">Complete</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Column Analysis
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Numeric Columns ({dataStats?.numericColumns.length})</span>
                  <span>{((dataStats?.numericColumns.length / dataStats?.totalColumns) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={(dataStats?.numericColumns.length / dataStats?.totalColumns) * 100} 
                  className="h-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Numeric: {dataStats?.numericColumns.slice(0, 3).join(', ')}
                {dataStats?.numericColumns.length > 3 && ` +${dataStats?.numericColumns.length - 3} more`}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {automaticInsights.map((insight, index) => {
                  const Icon = insight.icon;
                  const typeColors = {
                    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  };

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${typeColors[insight.type]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold">{insight.title}</h5>
                            <Badge variant="outline" size="sm">{insight.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          <p className="text-sm font-medium">
                            💡 {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="formulas" className="space-y-4">
            <ScrollArea className="h-80">
              <div className="space-y-6">
                {suggestedFormulas.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {category.category}
                    </h4>
                    <div className="space-y-3">
                      {category.formulas.map((formula, formulaIndex) => (
                        <div key={formulaIndex} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-semibold mb-1">{formula.name}</h5>
                              <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                                {formula.formula}
                              </code>
                              <p className="text-sm text-muted-foreground mt-2">
                                {formula.description}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                💼 {formula.useCase}
                              </p>
                            </div>
                            <CopyButton 
                              text={formula.formula}
                              size="sm"
                              variant="outline"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {categoryIndex < suggestedFormulas.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-4">
            {insights ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI-Generated Analysis
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{insights}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No AI analysis available</p>
                {onRegenerateInsights && (
                  <AnimatedButton
                    animation="glow"
                    onClick={handleRegenerateInsights}
                    disabled={isLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Analysis
                  </AnimatedButton>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
