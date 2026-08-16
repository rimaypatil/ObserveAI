import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { AIAgentsSection } from '@/components/landing/AIAgentsSection';
import { SdkSection } from '@/components/landing/SdkSection';
import { TelemetrySection } from '@/components/landing/TelemetrySection';
import { RcaVisualSection } from '@/components/landing/RcaVisualSection';
import { DifferentiationSection } from '@/components/landing/DifferentiationSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { DeveloperExperienceSection } from '@/components/landing/DeveloperExperienceSection';
import { Footer } from '@/components/landing/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main>
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <HowItWorksSection />
        <AIAgentsSection />
        <SdkSection />
        <TelemetrySection />
        <RcaVisualSection />
        <DifferentiationSection />
        <SecuritySection />
        <DeveloperExperienceSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
