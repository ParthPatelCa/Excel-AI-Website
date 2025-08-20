// Demo data for showcasing DataSense AI features
export const demoData = {
  // Sample sales data
  salesData: [
    { month: 'Jan', revenue: 45000, customers: 120, region: 'North' },
    { month: 'Feb', revenue: 52000, customers: 135, region: 'North' },
    { month: 'Mar', revenue: 48000, customers: 125, region: 'North' },
    { month: 'Apr', revenue: 61000, customers: 150, region: 'South' },
    { month: 'May', revenue: 55000, customers: 140, region: 'South' },
    { month: 'Jun', revenue: 67000, customers: 165, region: 'South' },
    { month: 'Jul', revenue: 72000, customers: 180, region: 'East' },
    { month: 'Aug', revenue: 69000, customers: 175, region: 'East' },
    { month: 'Sep', revenue: 74000, customers: 185, region: 'East' },
    { month: 'Oct', revenue: 78000, customers: 195, region: 'West' },
    { month: 'Nov', revenue: 81000, customers: 200, region: 'West' },
    { month: 'Dec', revenue: 85000, customers: 210, region: 'West' }
  ],

  // Sample customer feedback
  customerFeedback: [
    "The product quality is excellent and delivery was fast!",
    "Great customer service, very responsive team.",
    "Product didn't meet expectations, delivery was delayed.",
    "Amazing features, exactly what we needed for our business.",
    "Price is a bit high but the quality justifies it.",
    "User interface could be more intuitive, but overall good.",
    "Outstanding support team, they resolved our issue quickly.",
    "Product works well but setup process was complicated.",
    "Excellent value for money, highly recommend!",
    "The documentation could be better, but product is solid."
  ],

  // Sample product data
  productData: [
    { product: 'DataSense Pro', category: 'Software', price: 299, units: 45, satisfaction: 4.5 },
    { product: 'Analytics Suite', category: 'Software', price: 199, units: 62, satisfaction: 4.2 },
    { product: 'Business Intelligence', category: 'Software', price: 399, units: 38, satisfaction: 4.7 },
    { product: 'Data Connector', category: 'Integration', price: 99, units: 85, satisfaction: 4.1 },
    { product: 'Dashboard Builder', category: 'Visualization', price: 149, units: 71, satisfaction: 4.4 },
    { product: 'Report Generator', category: 'Reporting', price: 79, units: 93, satisfaction: 4.0 }
  ],

  // Pre-generated insights
  insights: {
    salesTrends: [
      "📈 Revenue shows strong upward trend with 89% growth from Jan to Dec",
      "🎯 Q4 performance exceeded expectations with 23% above Q3 average",
      "🌟 West region shows highest growth potential with 195% revenue increase",
      "⚠️ Customer acquisition slowed in Q2, but recovered strongly in Q3"
    ],
    customerSentiment: [
      "😊 Overall sentiment is 72% positive across customer feedback",
      "💪 Product quality and customer service are top strengths",
      "⚡ Fast delivery and responsive support drive satisfaction",
      "🔧 Main improvement areas: pricing strategy and user interface"
    ],
    productPerformance: [
      "🏆 Business Intelligence leads in satisfaction (4.7/5) despite premium pricing",
      "📊 Data Connector shows highest volume (85 units) with competitive pricing",
      "💡 Software category dominates revenue with 3 top-performing products",
      "🎯 Focus on visualization tools shows promising market demand"
    ]
  },

  // Sample Excel formulas for tools demo
  excelFormulas: [
    {
      description: "Calculate total revenue with tax",
      formula: "=SUM(B2:B13) * 1.08",
      explanation: "Sums revenue column and adds 8% tax"
    },
    {
      description: "Find average customer satisfaction",
      formula: "=AVERAGE(F2:F7)",
      explanation: "Calculates mean satisfaction score"
    },
    {
      description: "Count high-performing products",
      formula: "=COUNTIF(F2:F7,\">4.3\")",
      explanation: "Counts products with satisfaction > 4.3"
    }
  ],

  // Sample SQL queries
  sqlQueries: [
    {
      description: "Get top performing regions",
      query: `SELECT region, SUM(revenue) as total_revenue
FROM sales_data 
GROUP BY region 
ORDER BY total_revenue DESC`,
      explanation: "Aggregates revenue by region and sorts by performance"
    },
    {
      description: "Find seasonal trends",
      query: `SELECT month, revenue,
  LAG(revenue) OVER (ORDER BY month) as prev_month,
  ((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month)) * 100 as growth_rate
FROM sales_data`,
      explanation: "Calculates month-over-month growth rates"
    }
  ]
}

export default demoData
