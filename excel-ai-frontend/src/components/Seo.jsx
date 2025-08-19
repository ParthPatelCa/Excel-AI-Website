import { useEffect } from "react";

export default function Seo({ title, description, canonical }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    if (description) meta.setAttribute("content", description);
    
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    if (canonical) link.setAttribute("href", canonical);
    
    return () => { 
      document.title = prevTitle; 
    };
  }, [title, description, canonical]);
  
  return null;
}
