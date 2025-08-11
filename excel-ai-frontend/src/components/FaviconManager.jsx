import React from 'react';

// SVG Favicon Component for React (for dynamic generation)
export const FaviconSVG = ({ size = 32, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle with gradient */}
    <defs>
      <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    
    <circle cx="16" cy="16" r="15" fill="url(#faviconGradient)" stroke="#1e293b" strokeWidth="2"/>
    
    {/* AI brain pattern */}
    <g fill="white" opacity="0.9">
      {/* Central processing unit */}
      <circle cx="16" cy="16" r="4" fill="white"/>
      
      {/* Neural network connections */}
      <circle cx="10" cy="10" r="1.5"/>
      <circle cx="22" cy="10" r="1.5"/>
      <circle cx="10" cy="22" r="1.5"/>
      <circle cx="22" cy="22" r="1.5"/>
      
      {/* Connection lines */}
      <line x1="16" y1="16" x2="10" y2="10" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="16" y1="16" x2="22" y2="10" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="16" y1="16" x2="10" y2="22" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="16" y1="16" x2="22" y2="22" stroke="white" strokeWidth="1" opacity="0.7"/>
      
      {/* Data flow indicators */}
      <circle cx="8" cy="16" r="1"/>
      <circle cx="24" cy="16" r="1"/>
      <circle cx="16" cy="8" r="1"/>
      <circle cx="16" cy="24" r="1"/>
    </g>
  </svg>
);

// Generate favicon files as base64 data URLs
export const generateFaviconDataURL = (size = 32) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4f46e5');
  gradient.addColorStop(1, '#06b6d4');
  
  // Draw background circle
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw AI pattern
  ctx.fillStyle = 'white';
  
  // Central circle
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/8, 0, 2 * Math.PI);
  ctx.fill();
  
  // Corner dots
  const dotSize = size/20;
  const offset = size/3.2;
  ctx.beginPath();
  ctx.arc(size/2 - offset, size/2 - offset, dotSize, 0, 2 * Math.PI);
  ctx.arc(size/2 + offset, size/2 - offset, dotSize, 0, 2 * Math.PI);
  ctx.arc(size/2 - offset, size/2 + offset, dotSize, 0, 2 * Math.PI);
  ctx.arc(size/2 + offset, size/2 + offset, dotSize, 0, 2 * Math.PI);
  ctx.fill();
  
  // Connection lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 - offset, size/2 - offset);
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 + offset, size/2 - offset);
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 - offset, size/2 + offset);
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 + offset, size/2 + offset);
  ctx.stroke();
  
  // Edge dots
  const edgeOffset = size/2.3;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size/2 - edgeOffset, size/2, dotSize/2, 0, 2 * Math.PI);
  ctx.arc(size/2 + edgeOffset, size/2, dotSize/2, 0, 2 * Math.PI);
  ctx.arc(size/2, size/2 - edgeOffset, dotSize/2, 0, 2 * Math.PI);
  ctx.arc(size/2, size/2 + edgeOffset, dotSize/2, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas.toDataURL();
};

// Utility to update favicon dynamically
export const updateFavicon = (dataURL) => {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'icon';
  link.href = dataURL;
  document.head.appendChild(link);
};

// Component to handle favicon updates
export const FaviconManager = ({ theme = 'light' }) => {
  React.useEffect(() => {
    const faviconDataURL = generateFaviconDataURL(32);
    updateFavicon(faviconDataURL);
    
    // Also update larger sizes for different contexts
    const sizes = [16, 32, 48, 64, 128, 256];
    sizes.forEach(size => {
      let link = document.querySelector(`link[rel="icon"][sizes="${size}x${size}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.sizes = `${size}x${size}`;
        document.head.appendChild(link);
      }
      link.href = generateFaviconDataURL(size);
    });
    
    // Add Apple touch icon
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.sizes = '180x180';
      document.head.appendChild(appleLink);
    }
    appleLink.href = generateFaviconDataURL(180);
    
  }, [theme]);
  
  return null; // This component doesn't render anything
};

export default FaviconManager;
