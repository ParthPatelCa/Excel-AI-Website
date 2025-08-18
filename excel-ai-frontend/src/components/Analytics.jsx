import React, { useEffect } from 'react';

// Analytics Configuration
const ANALYTICS_CONFIG = {
  // Plausible Analytics (Privacy-friendly)
  plausible: {
    domain: 'datasense-ai.com', // Replace with your actual domain
    src: 'https://plausible.io/js/script.js',
    enabled: process.env.NODE_ENV === 'production'
  },
  
  // Google Analytics 4 (if needed)
  ga4: {
    measurementId: 'G-XXXXXXXXXX', // Replace with your GA4 measurement ID
    enabled: false // Set to true to enable GA4
  },
  
  // Custom analytics events
  events: {
    FILE_UPLOAD: 'file_upload',
    ANALYSIS_COMPLETE: 'analysis_complete',
    CHART_CREATED: 'chart_created',
    TOOL_USED: 'tool_used',
    ERROR_OCCURRED: 'error_occurred',
    FEATURE_ACCESSED: 'feature_accessed',
    USER_ENGAGEMENT: 'user_engagement'
  }
};

// Privacy-friendly analytics utility
class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.queue = [];
    this.userConsent = this.getUserConsent();
  }
  
  // Check user consent for analytics
  getUserConsent() {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem('analytics_consent');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // Default to false, requiring explicit consent
    return false;
  }
  
  // Set user consent
  setUserConsent(consent) {
    this.userConsent = consent;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', JSON.stringify(consent));
    }
    
    if (consent && !this.isInitialized) {
      this.initialize();
    }
  }
  
  // Initialize analytics
  initialize() {
    if (this.isInitialized || !this.userConsent) return;
    
    // Initialize Plausible Analytics
    if (ANALYTICS_CONFIG.plausible.enabled) {
      this.initializePlausible();
    }
    
    // Initialize GA4 if enabled
    if (ANALYTICS_CONFIG.ga4.enabled) {
      this.initializeGA4();
    }
    
    this.isInitialized = true;
    
    // Process queued events
    this.queue.forEach(event => this.trackEvent(event.name, event.properties));
    this.queue = [];
  }
  
  // Initialize Plausible Analytics
  initializePlausible() {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', ANALYTICS_CONFIG.plausible.domain);
    script.src = ANALYTICS_CONFIG.plausible.src;
    
    // Add privacy-friendly attributes
    script.setAttribute('data-exclude', '/admin, /preview');
    script.setAttribute('data-include-hash', 'true');
    
    document.head.appendChild(script);
    
    // Make plausible function available
    window.plausible = window.plausible || function() {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  }
  
  // Initialize Google Analytics 4
  initializeGA4() {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.ga4.measurementId}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.ga4.measurementId, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });
    
    window.gtag = gtag;
  }
  
  // Track page views
  trackPageView(page) {
    if (!this.userConsent) return;
    
    if (!this.isInitialized) {
      this.queue.push({ name: 'pageview', properties: { page } });
      return;
    }
    
    // Plausible page tracking
    if (ANALYTICS_CONFIG.plausible.enabled && window.plausible) {
      window.plausible('pageview', { u: window.location.href });
    }
    
    // GA4 page tracking
    if (ANALYTICS_CONFIG.ga4.enabled && window.gtag) {
      window.gtag('config', ANALYTICS_CONFIG.ga4.measurementId, {
        page_path: page
      });
    }
  }
  
  // Track custom events
  trackEvent(eventName, properties = {}) {
    if (!this.userConsent) return;
    
    if (!this.isInitialized) {
      this.queue.push({ name: eventName, properties });
      return;
    }
    
    // Plausible event tracking
    if (ANALYTICS_CONFIG.plausible.enabled && window.plausible) {
      window.plausible(eventName, { props: properties });
    }
    
    // GA4 event tracking
    if (ANALYTICS_CONFIG.ga4.enabled && window.gtag) {
      window.gtag('event', eventName, properties);
    }
    
    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventName, properties);
    }
  }
  
  // Track user engagement
  trackEngagement(section, action, value = null) {
    this.trackEvent(ANALYTICS_CONFIG.events.USER_ENGAGEMENT, {
      section,
      action,
      value,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track errors
  trackError(error, context = {}) {
    this.trackEvent(ANALYTICS_CONFIG.events.ERROR_OCCURRED, {
      error_message: error.message || error,
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Create global analytics instance
const analytics = new AnalyticsManager();

// React Hook for analytics
export const useAnalytics = () => {
  const trackEvent = (eventName, properties) => {
    analytics.trackEvent(eventName, properties);
  };
  
  const trackPageView = (page) => {
    analytics.trackPageView(page);
  };
  
  const trackEngagement = (section, action, value) => {
    analytics.trackEngagement(section, action, value);
  };
  
  const trackError = (error, context) => {
    analytics.trackError(error, context);
  };
  
  return {
    trackEvent,
    trackPageView,
    trackEngagement,
    trackError,
    events: ANALYTICS_CONFIG.events
  };
};

// Analytics Provider Component
export const AnalyticsProvider = ({ children }) => {
  useEffect(() => {
    // Initialize analytics if consent is already given
    if (analytics.getUserConsent()) {
      analytics.initialize();
    }
  }, []);
  
  return children;
};

// Cookie Consent Banner Component
export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  useEffect(() => {
    // Show banner if no consent decision has been made
    const hasDecision = localStorage.getItem('analytics_consent') !== null;
    setShowBanner(!hasDecision);
  }, []);
  
  const handleAccept = async () => {
    setIsLoading(true);
    analytics.setUserConsent(true);
    localStorage.setItem('analytics_consent', JSON.stringify(true));
    setShowBanner(false);
    setIsLoading(false);
  };
  
  const handleDecline = () => {
    analytics.setUserConsent(false);
    localStorage.setItem('analytics_consent', JSON.stringify(false));
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We use privacy-friendly analytics to improve your experience. 
              <a 
                href="/privacy" 
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                Learn more about our privacy policy
              </a>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Loading...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// HOC for tracking page views
export const withPageTracking = (WrappedComponent, pageName) => {
  return function TrackedComponent(props) {
    useEffect(() => {
      analytics.trackPageView(pageName || window.location.pathname);
    }, []);
    
    return <WrappedComponent {...props} />;
  };
};

// Component for tracking section views
export const SectionTracker = ({ section, children, trackOnView = true }) => {
  const sectionRef = React.useRef(null);
  const [hasTracked, setHasTracked] = React.useState(false);
  
  useEffect(() => {
    if (!trackOnView || hasTracked) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTracked) {
          analytics.trackEngagement(section, 'section_viewed');
          setHasTracked(true);
        }
      },
      { threshold: 0.5 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, [section, trackOnView, hasTracked]);
  
  return (
    <div ref={sectionRef}>
      {children}
    </div>
  );
};

// Export analytics instance and config
export { analytics, ANALYTICS_CONFIG };
export default AnalyticsProvider;
