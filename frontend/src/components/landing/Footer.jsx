import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const Footer = () => {
  const scrollToSection = (e, href) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#080D1A] border-t border-[#263247] pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#263247]">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-slate-100">Observe</span>
                <span className="text-lg font-bold text-blue-400">AI</span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              AI-powered observability and autonomous root cause analysis platform. Transform raw production telemetry into actionable incident explanations instantly.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" onClick={(e) => scrollToSection(e, '#hero')} className="hover:text-white transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#ai-agents" onClick={(e) => scrollToSection(e, '#ai-agents')} className="hover:text-white transition-colors">
                  AI RCA Agents
                </a>
              </li>
              <li>
                <a href="#sdk" onClick={(e) => scrollToSection(e, '#sdk')} className="hover:text-white transition-colors">
                  SDK Integration
                </a>
              </li>
            </ul>
          </div>

          {/* Developers Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Developers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#dx" onClick={(e) => scrollToSection(e, '#dx')} className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#dx" onClick={(e) => scrollToSection(e, '#dx')} className="hover:text-white transition-colors">
                  API Endpoints
                </a>
              </li>
              <li>
                <a href="#sdk" onClick={(e) => scrollToSection(e, '#sdk')} className="hover:text-white transition-colors">
                  SDK Setup
                </a>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Account</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register Account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-white transition-colors">
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ObserveAI. All rights reserved.</p>
          <p className="font-mono text-[11px]">AI-powered observability and autonomous root cause analysis.</p>
        </div>
      </div>
    </footer>
  );
};
