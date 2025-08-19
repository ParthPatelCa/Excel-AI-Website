import { useMemo, useState, useEffect } from "react";
import Seo from "../components/Seo.jsx";
import { TOOLS, TASK_CATEGORIES, PLATFORM_INFO, LEVEL_INFO } from "../data/tools.js";

function useQueryParam(key, initial = "") {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get(key) || initial;
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (value) params.set(key, value); 
      else params.delete(key);
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", next);
    }
  }, [key, value]);

  return [value, setValue];
}

export default function ToolsDirectory() {
  const [q, setQ] = useQueryParam("q");
  const [task, setTask] = useQueryParam("task");
  const [plat, setPlat] = useQueryParam("platform");
  const [level, setLevel] = useQueryParam("level");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return TOOLS.filter(t =>
      (!ql || t.name.toLowerCase().includes(ql) || t.short.toLowerCase().includes(ql)) &&
      (!task || t.tasks.includes(task)) &&
      (!plat || t.platforms.includes(plat)) &&
      (!level || t.level === level)
    );
  }, [q, task, plat, level]);

  const clearFilters = () => {
    setQ("");
    setTask("");
    setPlat("");
    setLevel("");
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Seo
        title="AI Tools Directory — DataSense AI | Excel & Sheets Automation"
        description="Discover powerful AI tools for Excel and Google Sheets. Filter by task, platform, and skill level to find the perfect automation solution."
        canonical="https://datasense-ai.netlify.app/tools"
      />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          AI Tools Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Filter by task, platform, or skill level to find the perfect tool for your spreadsheet needs.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search tools..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select 
            value={task} 
            onChange={e => setTask(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tasks</option>
            <option value="formulas">Formulas</option>
            <option value="cleaning">Data Cleaning</option>
            <option value="text">Text Analysis</option>
            <option value="charts">Visualizations</option>
            <option value="automation">Automation</option>
          </select>
          
          <select 
            value={plat} 
            onChange={e => setPlat(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Platforms</option>
            <option value="excel">Microsoft Excel</option>
            <option value="sheets">Google Sheets</option>
            <option value="airtable">Airtable</option>
            <option value="csv">CSV Files</option>
          </select>
          
          <select 
            value={level} 
            onChange={e => setLevel(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="quick">Quick Start</option>
            <option value="power">Power User</option>
            <option value="admin">Admin Tools</option>
          </select>
        </div>
        
        {(q || task || plat || level) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filtered.length} of {TOOLS.length} tools
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Tools Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(tool => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tools found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool }) {
  const getLevelColor = (level) => {
    switch (level) {
      case 'quick': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'power': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTaskColor = (task) => {
    switch (task) {
      case 'formulas': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cleaning': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'text': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'charts': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'automation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {tool.name}
        </h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(tool.level)}`}>
          {LEVEL_INFO[tool.level]?.name || tool.level}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
        {tool.short}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tool.tasks.map(task => (
          <span 
            key={task}
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTaskColor(task)}`}
          >
            {TASK_CATEGORIES[task]?.name || task}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {tool.platforms.map(platform => PLATFORM_INFO[platform]?.name || platform).join(", ")}
        </div>
        <a 
          href={tool.href}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Open tool
        </a>
      </div>
    </div>
  );
}
