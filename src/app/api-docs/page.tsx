"use client";

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // Fetch the spec from our internal API endpoint
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setSpec(data));
  }, []);

  if (!spec) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Header for Brand consistency */}
      <div className="bg-slate-900 px-8 py-6 flex justify-between items-center border-b border-white/10">
        <div>
          <h1 className="text-white text-xl font-black tracking-tighter">HTB GLOBAL <span className="text-secondary ml-2 font-bold uppercase text-[10px] tracking-widest bg-white/10 px-2 py-1 rounded">Developer Portal</span></h1>
        </div>
        <a href="/" className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Site
        </a>
      </div>
      
      <div className="max-w-7xl mx-auto py-8">
        <SwaggerUI spec={spec} />
      </div>

      <style jsx global>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #0F172A !important; font-family: var(--font-manrope) !important; font-weight: 900 !important; }
        .swagger-ui .scheme-container { background: #F8FAFC !important; box-shadow: none !important; border: 1px solid #E2E8F0 !important; border-radius: 16px !important; margin: 20px 0 !important; }
        .swagger-ui .opblock { border-radius: 12px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
        .swagger-ui .btn.execute { background-color: #0051D5 !important; border-color: #0051D5 !important; }
      `}</style>
    </div>
  );
}
