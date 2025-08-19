// Tool data model for the Tools section
// Defines tool categories, platforms, and metadata

/**
 * @typedef {"formulas" | "cleaning" | "text" | "charts" | "automation"} Task
 * @typedef {"excel" | "sheets" | "airtable" | "csv"} Platform  
 * @typedef {"quick" | "power" | "admin"} Level
 */

/**
 * @typedef {Object} ToolMeta
 * @property {string} slug - URL-friendly identifier
 * @property {string} name - Display name
 * @property {string} short - Brief description
 * @property {Task[]} tasks - Task categories this tool handles
 * @property {Platform[]} platforms - Supported platforms
 * @property {Level} level - Complexity level
 * @property {string} href - Route path
 */

export const TOOLS = [
  {
    slug: "formula-explainer",
    name: "Formula Explainer",
    short: "Paste a formula, get a plain English explanation and safer version.",
    tasks: ["formulas"],
    platforms: ["excel", "sheets"],
    level: "quick",
    href: "/tools/formula-explainer"
  },
  {
    slug: "clean-dates",
    name: "Clean Dates", 
    short: "Normalize mixed date formats and fix timezone or locale issues.",
    tasks: ["cleaning"],
    platforms: ["excel", "sheets", "csv"],
    level: "power",
    href: "/tools/clean-dates"
  },
  {
    slug: "classify-tickets",
    name: "Classify Tickets",
    short: "Tag support tickets by topic and urgency using a sample model.",
    tasks: ["text"],
    platforms: ["sheets", "csv"],
    level: "power",
    href: "/tools/classify-tickets"
  },
  {
    slug: "excel-formula-generator",
    name: "Excel Formula Generator",
    short: "Describe what you want to calculate and get the perfect formula.",
    tasks: ["formulas"],
    platforms: ["excel", "sheets"],
    level: "quick",
    href: "/tools/excel-formula-generator"
  },
  {
    slug: "sql-query-builder",
    name: "SQL Query Builder", 
    short: "Generate SQL queries from natural language descriptions.",
    tasks: ["formulas"],
    platforms: ["csv"],
    level: "power",
    href: "/tools/sql-query-builder"
  },
  {
    slug: "vba-script-generator",
    name: "VBA Script Generator",
    short: "Create custom Excel macros and automation scripts.",
    tasks: ["automation"],
    platforms: ["excel"],
    level: "admin",
    href: "/tools/vba-script-generator"
  },
  {
    slug: "text-to-excel",
    name: "Text to Excel Converter",
    short: "Transform unstructured text into organized spreadsheet data.",
    tasks: ["cleaning", "text"],
    platforms: ["excel", "sheets", "csv"],
    level: "quick",
    href: "/tools/text-to-excel"
  },
  {
    slug: "regex-generator",
    name: "Regex Pattern Generator",
    short: "Build regular expressions for data validation and extraction.",
    tasks: ["text", "cleaning"],
    platforms: ["excel", "sheets"],
    level: "power",
    href: "/tools/regex-generator"
  },
  {
    slug: "chart-recommendations",
    name: "Smart Chart Builder",
    short: "Get AI-powered chart suggestions based on your data structure.",
    tasks: ["charts"],
    platforms: ["excel", "sheets"],
    level: "quick",
    href: "/tools/chart-recommendations"
  },
  {
    slug: "data-formatter",
    name: "Data Formatter",
    short: "Clean and standardize messy data with intelligent formatting.",
    tasks: ["cleaning"],
    platforms: ["excel", "sheets", "csv"],
    level: "quick",
    href: "/tools/data-formatter"
  },
  {
    slug: "pivot-builder",
    name: "AI Pivot Builder",
    short: "Describe your analysis needs and get the perfect pivot table.",
    tasks: ["charts", "formulas"],
    platforms: ["excel", "sheets"],
    level: "power",
    href: "/tools/pivot-builder"
  },
  {
    slug: "sentiment-analysis",
    name: "Sentiment Analysis",
    short: "Analyze text sentiment in reviews, feedback, and comments.",
    tasks: ["text"],
    platforms: ["sheets", "csv"],
    level: "quick",
    href: "/tools/sentiment-analysis"
  }
];

// Filter helpers for easy tool discovery
export const getToolsByTask = (task) => TOOLS.filter(tool => tool.tasks.includes(task));
export const getToolsByPlatform = (platform) => TOOLS.filter(tool => tool.platforms.includes(platform));
export const getToolsByLevel = (level) => TOOLS.filter(tool => tool.level === level);
export const getToolBySlug = (slug) => TOOLS.find(tool => tool.slug === slug);

// Category definitions
export const TASK_CATEGORIES = {
  formulas: { name: "Formulas", icon: "calculator", color: "blue" },
  cleaning: { name: "Data Cleaning", icon: "broom", color: "green" },
  text: { name: "Text Analysis", icon: "type", color: "purple" },
  charts: { name: "Visualizations", icon: "bar-chart", color: "orange" },
  automation: { name: "Automation", icon: "zap", color: "yellow" }
};

export const PLATFORM_INFO = {
  excel: { name: "Microsoft Excel", icon: "file-spreadsheet", color: "emerald" },
  sheets: { name: "Google Sheets", icon: "table", color: "blue" },
  airtable: { name: "Airtable", icon: "database", color: "orange" },
  csv: { name: "CSV Files", icon: "file-text", color: "gray" }
};

export const LEVEL_INFO = {
  quick: { name: "Quick Start", description: "Ready in seconds", color: "green" },
  power: { name: "Power User", description: "Advanced features", color: "blue" },
  admin: { name: "Admin Tools", description: "Expert level", color: "purple" }
};
