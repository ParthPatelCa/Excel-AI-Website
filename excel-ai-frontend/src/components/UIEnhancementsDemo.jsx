import React from 'react';
import { AnimatedButton } from './AnimatedButton';
import { EnhancedLoading, EnhancedError, EnhancedFileUpload } from './EnhancedUI';
import { AccessibleProgress, LiveRegion } from './Accessibility';
import { FaviconSVG } from './FaviconManager';
import { useAnalytics } from './Analytics';

const UIEnhancementsDemo = () => {
  const [currentDemo, setCurrentDemo] = React.useState('buttons');
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [showLoading, setShowLoading] = React.useState(false);
  const [showError, setShowError] = React.useState(false);
  const { trackEvent } = useAnalytics();

  const handleDemoChange = (demo) => {
    setCurrentDemo(demo);
    trackEvent('demo_section_changed', { section: demo });
  };

  const handleFileUpload = (file) => {
    trackEvent('demo_file_uploaded', { fileName: file.name, fileSize: file.size });
    console.log('Demo file uploaded:', file.name);
  };

  const startLoadingDemo = () => {
    setShowLoading(true);
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowLoading(false);
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  const demoSections = [
    { id: 'buttons', label: 'Animated Buttons', icon: '🎯' },
    { id: 'loading', label: 'Enhanced Loading', icon: '⏳' },
    { id: 'error', label: 'Error Handling', icon: '⚠️' },
    { id: 'upload', label: 'File Upload', icon: '📁' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'favicon', label: 'Favicon System', icon: '🔖' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            UI/UX Enhancements Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore the comprehensive UI/UX improvements: Dark Mode Support, Accessibility Features, 
            Enhanced Animations, Professional Favicon System, and Privacy-Friendly Analytics Integration.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {demoSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleDemoChange(section.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${currentDemo === section.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {currentDemo === 'buttons' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Animated Buttons</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Basic Animations</h3>
                  <AnimatedButton animation="bounce" variant="default">
                    Bounce Effect
                  </AnimatedButton>
                  <AnimatedButton animation="pulse" variant="secondary">
                    Pulse Effect
                  </AnimatedButton>
                  <AnimatedButton animation="shake" variant="outline">
                    Shake Effect
                  </AnimatedButton>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Visual Effects</h3>
                  <AnimatedButton animation="glow" variant="default">
                    Glow Effect
                  </AnimatedButton>
                  <AnimatedButton animation="gradient" variant="default">
                    Gradient Animation
                  </AnimatedButton>
                  <AnimatedButton animation="ripple" variant="secondary">
                    Ripple Effect
                  </AnimatedButton>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Motion Effects</h3>
                  <AnimatedButton animation="slide" variant="outline">
                    Slide Animation
                  </AnimatedButton>
                  <AnimatedButton animation="float" variant="default">
                    Float Effect
                  </AnimatedButton>
                  <AnimatedButton animation="fade" variant="ghost">
                    Fade Transition
                  </AnimatedButton>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Specialized Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <AnimatedButton.CTA onClick={() => trackEvent('cta_clicked')}>
                    Call to Action
                  </AnimatedButton.CTA>
                  <AnimatedButton.Loading 
                    isLoading={showLoading} 
                    onClick={startLoadingDemo}
                  >
                    {showLoading ? 'Processing...' : 'Start Loading Demo'}
                  </AnimatedButton.Loading>
                  <AnimatedButton.FloatingAction 
                    onClick={() => trackEvent('fab_clicked')}
                    className="fixed bottom-6 right-6"
                  >
                    +
                  </AnimatedButton.FloatingAction>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'loading' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Enhanced Loading States</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Basic Loading</h3>
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <EnhancedLoading message="Processing your data..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Progress Loading</h3>
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <EnhancedLoading 
                      message="Uploading file..." 
                      progress={loadingProgress}
                      onCancel={() => setLoadingProgress(0)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <AnimatedButton 
                  animation="pulse" 
                  onClick={startLoadingDemo}
                  variant="default"
                >
                  Start Progress Demo
                </AnimatedButton>
                <AnimatedButton 
                  animation="fade" 
                  onClick={() => setLoadingProgress(0)}
                  variant="outline"
                >
                  Reset Progress
                </AnimatedButton>
              </div>
            </div>
          )}

          {currentDemo === 'error' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Error Handling</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Enhanced Error Display</h3>
                  <EnhancedError
                    error={new Error("Demo error: This is how errors are displayed in the enhanced UI")}
                    onRetry={() => {
                      setShowError(false);
                      trackEvent('error_retry_demo');
                    }}
                    onDismiss={() => {
                      setShowError(false);
                      trackEvent('error_dismiss_demo');
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <AnimatedButton 
                    animation="shake" 
                    onClick={() => setShowError(true)}
                    variant="destructive"
                  >
                    Trigger Error Demo
                  </AnimatedButton>
                  <AnimatedButton 
                    animation="fade" 
                    onClick={() => setShowError(false)}
                    variant="outline"
                  >
                    Clear Error
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'upload' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Enhanced File Upload</h2>
              
              <div className="max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Drag & Drop with Validation</h3>
                <EnhancedFileUpload
                  onFileSelect={handleFileUpload}
                  accept=".xlsx,.xls,.csv,.pdf,.txt"
                  maxSize={10 * 1024 * 1024} // 10MB
                />
              </div>
            </div>
          )}

          {currentDemo === 'accessibility' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Accessibility Features</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Progress Indicators</h3>
                  <div className="space-y-4">
                    <AccessibleProgress value={30} max={100} label="File upload progress: 30%" />
                    <AccessibleProgress value={75} max={100} label="Analysis progress: 75%" />
                    <AccessibleProgress value={100} max={100} label="Complete: 100%" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Live Regions</h3>
                  <LiveRegion>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This area will announce changes to screen readers automatically.
                      Status updates and dynamic content changes are communicated accessibly.
                    </p>
                  </LiveRegion>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Accessibility Features Implemented:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• ARIA labels and descriptions for all interactive elements</li>
                  <li>• Keyboard navigation support throughout the interface</li>
                  <li>• Screen reader announcements for dynamic content</li>
                  <li>• High contrast support and proper focus indicators</li>
                  <li>• Skip links for efficient navigation</li>
                  <li>• Accessible form validation and error messaging</li>
                </ul>
              </div>
            </div>
          )}

          {currentDemo === 'favicon' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dynamic Favicon System</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Favicon Preview</h3>
                  <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FaviconSVG size={32} />
                    <FaviconSVG size={48} />
                    <FaviconSVG size={64} />
                    <FaviconSVG size={96} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Different sizes of the AI-themed favicon with neural network pattern
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">Features</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• Dynamic favicon generation with Canvas API</li>
                      <li>• AI-themed design with neural network pattern</li>
                      <li>• Multiple sizes (16x16 to 256x256) for different contexts</li>
                      <li>• Apple touch icon support for mobile devices</li>
                      <li>• Automatic updates based on theme changes</li>
                      <li>• Professional gradient color scheme</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Info */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
            📊 Privacy-Friendly Analytics Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Features:</h4>
              <ul className="text-indigo-700 dark:text-indigo-300 space-y-1">
                <li>• GDPR-compliant with explicit consent</li>
                <li>• Plausible Analytics for privacy-first tracking</li>
                <li>• Custom event tracking for user interactions</li>
                <li>• Error tracking and performance monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Benefits:</h4>
              <ul className="text-indigo-700 dark:text-indigo-300 space-y-1">
                <li>• No personal data collection</li>
                <li>• Cookie-free tracking when using Plausible</li>
                <li>• Real-time insights into user behavior</li>
                <li>• Performance optimization data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIEnhancementsDemo;
