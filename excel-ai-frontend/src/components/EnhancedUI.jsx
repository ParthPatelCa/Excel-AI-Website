import React from 'react';
import { AnimatedButton } from './ui/AnimatedButton';
import { ThemeToggle } from './ui/ThemeToggle';
import { FaviconManager } from './FaviconManager';
import { AnalyticsProvider, CookieConsentBanner, SectionTracker, useAnalytics } from './Analytics';
import { AccessibleProgress, LiveRegion, SkipToContent } from './ui/Accessibility';
import { Toaster } from './ui/sonner.jsx'
import { UsageBadge } from './ui/UsageBadge.jsx'

// Enhanced Loading Component with Analytics
export const EnhancedLoading = ({ 
  message = "Processing your data...", 
  progress = null,
  onCancel = null,
  className = ""
}) => {
  const { trackEvent } = useAnalytics();
  
  React.useEffect(() => {
    trackEvent('loading_shown', { message, hasProgress: !!progress });
  }, [message, progress, trackEvent]);
  
  const handleCancel = () => {
    trackEvent('loading_cancelled', { message });
    onCancel?.();
  };
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative">
        {/* Animated loading spinner */}
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        
        {/* Progress ring overlay if progress is provided */}
        {progress !== null && (
          <div className="absolute inset-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-blue-600 dark:text-blue-400"
                strokeDasharray={`${progress * 1.76} 176`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
      
      <LiveRegion>
        <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white text-center">
          {message}
        </p>
        {progress !== null && (
          <AccessibleProgress 
            value={progress} 
            max={100} 
            className="w-64 mt-3"
            label={`Progress: ${Math.round(progress)}%`}
          />
        )}
      </LiveRegion>
      
      {onCancel && (
        <AnimatedButton
          variant="outline"
          animation="fade"
          onClick={handleCancel}
          className="mt-6"
        >
          Cancel
        </AnimatedButton>
      )}
    </div>
  );
};

// Enhanced Error Component with Analytics
export const EnhancedError = ({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  className = ""
}) => {
  const { trackError, trackEvent } = useAnalytics();
  
  React.useEffect(() => {
    trackError(error, { component: 'EnhancedError' });
  }, [error, trackError]);
  
  const handleRetry = () => {
    trackEvent('error_retry_clicked', { error: error.message });
    onRetry?.();
  };
  
  const handleDismiss = () => {
    trackEvent('error_dismissed', { error: error.message });
    onDismiss?.();
  };
  
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Something went wrong
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error.message || error}
          </p>
          
          <div className="mt-4 flex gap-3">
            {onRetry && (
              <AnimatedButton
                variant="outline"
                animation="pulse"
                onClick={handleRetry}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Try Again
              </AnimatedButton>
            )}
            {onDismiss && (
              <AnimatedButton
                variant="ghost"
                animation="fade"
                onClick={handleDismiss}
                className="text-red-600"
              >
                Dismiss
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced File Upload Component
export const EnhancedFileUpload = ({ 
  onFileSelect, 
  accept = ".xlsx,.xls,.csv",
  maxSize = 16 * 1024 * 1024, // 16MB
  className = ""
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { trackEvent } = useAnalytics();
  const fileInputRef = React.useRef(null);
  
  const validateFile = (file) => {
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not supported. Please use: ${allowedTypes.join(', ')}`);
    }
  };
  
  const handleFileSelect = (file) => {
    setError(null);
    
    try {
      validateFile(file);
      trackEvent('file_upload_started', { 
        fileName: file.name, 
        fileSize: file.size,
        fileType: file.type 
      });
      onFileSelect(file);
    } catch (err) {
      setError(err.message);
      trackEvent('file_upload_error', { 
        error: err.message,
        fileName: file.name 
      });
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label="Upload file area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          aria-hidden="true"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <svg 
              className={`w-12 h-12 transition-colors ${
                isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports {accept} files up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Enhanced Navigation Component
export const EnhancedNavigation = ({ currentView, onViewChange, className = "" }) => {
  const { trackEvent } = useAnalytics();
  
  const sections = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'connect', label: 'Connect', icon: 'link' },
    { id: 'analyze', label: 'Analyze', icon: 'chart-bar', featured: true },
    { id: 'visualize', label: 'Visualize', icon: 'chart-pie' },
    { id: 'data-prep', label: 'Data Prep', icon: 'cog' },
    { id: 'enrich', label: 'Enrich', icon: 'sparkles' },
    { id: 'tools', label: 'Tools', icon: 'wrench' }
  ];
  
  const getIcon = (iconName) => {
    const icons = {
      home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      link: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      'chart-bar': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      'chart-pie': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />,
      cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
      sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
      wrench: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    };
    return icons[iconName] || icons.home;
  };
  
  const handleNavigation = (sectionId) => {
    trackEvent('navigation_clicked', { 
      from: currentView, 
      to: sectionId,
      featured: sections.find(s => s.id === sectionId)?.featured || false
    });
    onViewChange(sectionId);
  };
  
  return (
    <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <circle cx="6" cy="6" r="1"/>
                <circle cx="18" cy="6" r="1"/>
                <circle cx="6" cy="18" r="1"/>
                <circle cx="18" cy="18" r="1"/>
                <line x1="12" y1="12" x2="6" y2="6"/>
                <line x1="12" y1="12" x2="18" y2="6"/>
                <line x1="12" y1="12" x2="6" y2="18"/>
                <line x1="12" y1="12" x2="18" y2="18"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                DataSense AI
              </h1>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavigation(section.id)}
                className={`
                  relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${currentView === section.id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                  ${section.featured ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}
                `}
                aria-current={currentView === section.id ? 'page' : undefined}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getIcon(section.icon)}
                  </svg>
                  <span>{section.label}</span>
                  {section.featured && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      ⭐
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center space-x-3">
            <UsageBadge />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

// Enhanced App Wrapper
export const EnhancedApp = ({ children }) => {
  return (
    <AnalyticsProvider>
      <FaviconManager />
      <SkipToContent />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {children}
      </div>
      <Toaster />
      <CookieConsentBanner />
    </AnalyticsProvider>
  );
};

export {
  SectionTracker,
  useAnalytics
};
