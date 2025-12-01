"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShieldCheck, HardHat, ArrowRight, Activity, 
  TrendingUp, FileText, Menu, X, Anchor, Factory, 
  Loader2, AlertCircle, RefreshCcw, Download, Settings, 
  Database, Trophy, LayoutDashboard, FlaskConical
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts';

// --- 1. CONSTANTS & CONFIGURATION ---

const GENESIS_DATE = new Date('2009-01-03').getTime();
const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const PROJECT_TO_YEAR = 2035;
const MODEL_COEFF = 7.34596586961056e-18;
const MODEL_EXPONENT = 5.82;
const START_YEAR = 2016;

// Image Paths
const HERO_IMAGE_LOCAL = "/assets/industrial-refinery-hero.png";
const MONOCHROME_IMAGE_LOCAL = "/assets/industrial-monochrome.png";
const HERO_FALLBACK = "https://images.unsplash.com/photo-1518709911915-712d59df4634?q=80&w=2600&auto=format&fit=crop"; 
const MONOCHROME_FALLBACK = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2672&auto=format&fit=crop";

// Types
interface Asset {
  symbol: string;
  name: string;
  color: string;
}

// Comparison Assets
const ASSETS: Asset[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', color: '#f7931a' },
  { symbol: 'DOW', name: 'Dow Inc.', color: '#C8102E' }, 
  { symbol: 'BASFY', name: 'BASF (ADR)', color: '#004A96' }, 
  { symbol: 'CE', name: 'Celanese', color: '#008542' },
  { symbol: 'MEOH', name: 'Methanex', color: '#582C83' },
  { symbol: 'FSCHX', name: 'Fidelity Chem', color: '#71c7ec' }
];

const STATIC_HISTORY: Record<number, Record<string, { start: number; end: number } | null>> = {
  2016: { 'BTC-USD': { start: 434, end: 963 }, 'DOW': null, 'BASFY': { start: 16.5, end: 20.8 }, 'CE': { start: 66, end: 78.5 }, 'MEOH': { start: 27.77, end: 45.95 }, 'FSCHX': { start: 12.12, end: 14.91 } },
  2017: { 'BTC-USD': { start: 963, end: 13860 }, 'DOW': null, 'BASFY': { start: 20.8, end: 27.5 }, 'CE': { start: 78.5, end: 107 }, 'MEOH': { start: 45.95, end: 54.15 }, 'FSCHX': { start: 14.91, end: 18.42 } },
  2018: { 'BTC-USD': { start: 13860, end: 3740 }, 'DOW': null, 'BASFY': { start: 27.5, end: 17.2 }, 'CE': { start: 107, end: 90 }, 'MEOH': { start: 54.15, end: 64.49 }, 'FSCHX': { start: 18.42, end: 14.42 } },
  2019: { 'BTC-USD': { start: 3740, end: 7200 }, 'DOW': { start: 51.63, end: 54.73 }, 'BASFY': { start: 17.2, end: 19.5 }, 'CE': { start: 90, end: 123 }, 'MEOH': { start: 64.49, end: 35.42 }, 'FSCHX': { start: 14.42, end: 11.95 } },
  2020: { 'BTC-USD': { start: 7200, end: 28990 }, 'DOW': { start: 46.07, end: 55.5 }, 'BASFY': { start: 19.5, end: 17.8 }, 'CE': { start: 123, end: 129 }, 'MEOH': { start: 35.42, end: 45.45 }, 'FSCHX': { start: 11.95, end: 12.26 } },
  2021: { 'BTC-USD': { start: 28990, end: 46200 }, 'DOW': { start: 55.5, end: 56.72 }, 'BASFY': { start: 17.8, end: 19.2 }, 'CE': { start: 129, end: 168 }, 'MEOH': { start: 45.45, end: 39.55 }, 'FSCHX': { start: 12.26, end: 16.76 } },
  2022: { 'BTC-USD': { start: 46200, end: 16530 }, 'DOW': { start: 59.73, end: 50.39 }, 'BASFY': { start: 19.2, end: 13.5 }, 'CE': { start: 168, end: 102.2 }, 'MEOH': { start: 39.55, end: 37.86 }, 'FSCHX': { start: 16.76, end: 15.81 } },
  2023: { 'BTC-USD': { start: 16530, end: 42260 }, 'DOW': { start: 59.35, end: 54.84 }, 'BASFY': { start: 13.5, end: 15.2 }, 'CE': { start: 102.2, end: 155.3 }, 'MEOH': { start: 37.86, end: 47.36 }, 'FSCHX': { start: 15.81, end: 15.41 } },
  2024: { 'BTC-USD': { start: 42260, end: 98000 }, 'DOW': { start: 53.6, end: 40.13 }, 'BASFY': { start: 15.2, end: 12.44 }, 'CE': { start: 146.14, end: 68.76 }, 'MEOH': { start: 45.58, end: 49 }, 'FSCHX': { start: 14.78, end: 13.53 } },
  2025: { 'BTC-USD': { start: 98000, end: 87556 }, 'DOW': { start: 39.05, end: 22.21 }, 'BASFY': { start: 12.44, end: 12.18 }, 'CE': { start: 68, end: 37.93 }, 'MEOH': { start: 49.55, end: 35.09 }, 'FSCHX': { start: 12.88, end: 11.57 } }
};

// --- 2. HELPERS ---

const calculateFairPrice = (days: number) => days <= 0 ? 0 : MODEL_COEFF * Math.pow(days, MODEL_EXPONENT);
const formatPrice = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-';
  return val > 1000 ? `$${val.toLocaleString(undefined, {maximumFractionDigits: 0})}` : `$${val.toFixed(2)}`;
};
const formatCurrency = (val: number) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(0)}`;

const fetchWithRetry = async (url: string, maxRetries = 3, initialDelay = 1000) => {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        }
    }
};

// --- 3. BASE COMPONENTS ---

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
}

const Button = ({ children, variant = "primary", className = "", onClick }: ButtonProps) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-sm transition-all duration-200 shadow-sm cursor-pointer";
  const variants = {
    primary: "border-transparent text-slate-900 bg-amber-500 hover:bg-amber-400 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500",
    secondary: "border-slate-600 text-slate-200 bg-transparent hover:bg-slate-800 hover:border-slate-500 focus:ring-2 focus:ring-offset-2 focus:ring-slate-500",
    outline: "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Section = ({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) => (
  <div id={id} className={`py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle, light = false }: { title: string; subtitle?: boolean; light?: boolean }) => (
  <div className="mb-12">
    <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>
      {title}
    </h2>
    {subtitle && (
      <div className={`mt-4 w-24 h-1 ${light ? 'bg-amber-500' : 'bg-slate-900'}`}></div>
    )}
  </div>
);

interface ImageFallbackProps {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}

const ImageWithFallback = ({ src, fallback, alt, className }: ImageFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className}
      onError={() => setImgSrc(fallback)} 
    />
  );
};

// --- 4. LAYOUT COMPONENTS ---

interface NavProps {
  currentView: string;
  setView: (view: string) => void;
}

const Navbar = ({ currentView, setView }: NavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { label: 'Home', view: 'home' },
    { label: 'About This Project', view: 'executives' },
    { label: 'Data & Models', view: 'data' },
    { label: 'FAQ', view: 'home', section: 'faq' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <Factory className="h-8 w-8 text-amber-500 mr-3" />
            <span className="text-white text-xl font-bold tracking-tight">The Sound Treasury <span className="text-slate-400 font-light">Institute</span></span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    setView(link.view);
                    if(link.section) setTimeout(() => {
                         const el = document.getElementById(link.section);
                         if(el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className={`${currentView === link.view ? 'text-amber-500' : 'text-slate-300 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setView(link.view);
                  setIsOpen(false);
                }}
                className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 mt-auto w-full">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 pb-8 border-b border-slate-800 text-center">
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          This is a personal research project. It is not a business, advisory service, or commercial offering.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-1 md:col-span-2">
           <div className="flex items-center mb-4">
            <Factory className="h-6 w-6 text-amber-600 mr-2" />
            <span className="text-white text-lg font-bold">The Sound Treasury Institute</span>
          </div>
          <p className="text-sm text-slate-500 max-w-sm">
            Strategy, data, and frameworks for industrial businesses facing rising monetary and credit uncertainty.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>info@soundmoneytreasury.org</li>
            <li>Omaha, NE</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-900 pt-8 text-xs text-slate-600 space-y-4">
        <h5 className="text-slate-500 font-bold uppercase tracking-wider">Disclaimer</h5>
        <p>The information on this website is provided for educational and informational purposes only and does not constitute investment, legal, tax, or accounting advice.</p>
        <p>Nothing on this site is an offer to buy or sell any security, commodity, or other financial instrument.</p>
        <p className="mt-4">&copy; {new Date().getFullYear()} The Sound Treasury Institute. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// --- 5. PAGE VIEWS ---

const HomeView = ({ setView }: NavProps) => (
  <>
    <div className="relative bg-slate-900 overflow-hidden min-h-[600px] flex items-center">
      <div className="absolute inset-0">
        <ImageWithFallback 
          src={HERO_IMAGE_LOCAL} 
          fallback={HERO_FALLBACK}
          alt="Modern Industrial Chemical Facility" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
        <div className="lg:w-2/3">
          <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl mb-6 drop-shadow-lg">
            Industrial Capital, <br className="hidden md:block" />
            <span className="text-amber-500">Rewired</span> for a New Monetary Era
          </h1>
          <p className="mt-4 text-xl text-slate-200 max-w-3xl leading-relaxed drop-shadow-md">
            Strategy, data, and frameworks designed for industrial and chemical businesses navigating rising monetary and credit uncertainty.
          </p>
          <p className="text-lg text-amber-500 font-medium mt-4 drop-shadow">
            Independent research on long-horizon capital and treasury resilience.
          </p>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-slate-700/50 pt-6">
            <div className="flex items-center space-x-3">
              <HardHat className="h-5 w-5 text-slate-400 shrink-0" />
              <span className="text-slate-300 font-medium">Built by operators, not influencers</span>
            </div>
            <div className="flex items-center space-x-3">
              <Factory className="h-5 w-5 text-slate-400 shrink-0" />
              <span className="text-slate-300 font-medium">Designed for capital-intensive businesses</span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0" />
              <span className="text-slate-300 font-medium">Focused on balance-sheet resilience</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Section className="bg-white">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionTitle title="Who We Are" />
          <div className="text-lg text-slate-600 mb-6 space-y-4">
            <p>We focus on one intersection: <strong className="text-slate-900">industrial and chemical businesses × corporate treasury × long-horizon capital resilience.</strong></p>
            <p>We speak the language of uptime, safety, and reliability; working capital, capex, and ROIC; boards, lenders, and regulators.</p>
          </div>
          <div className="bg-slate-50 p-6 border-l-4 border-amber-500">
            <p className="font-semibold text-slate-900">We are not an asset manager and we don’t sell trading products.</p>
            <p className="text-slate-600 mt-2">Our job is simpler and harder: Help serious operators design balance sheets that can survive—and take advantage of—a more unstable monetary and credit environment.</p>
          </div>
        </div>
        <div className="bg-slate-100 p-8 rounded-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-wider">The Operator's Reality</h3>
          <ul className="space-y-4">
            {["Rising raw material volatility", "Unpredictable cost of capital", "Long-cycle CaPex vs Short-cycle Rates", "Pension and liability matching"].map((item, i) => (
              <li key={i} className="flex items-center text-slate-700">
                <div className="h-2 w-2 bg-amber-500 rounded-full mr-3"></div>{item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>

    <Section className="bg-slate-50 border-t border-slate-200">
      <SectionTitle title="What We Do" />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200 hover:border-amber-400 transition-colors">
          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
            <FileText className="h-6 w-6 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Executive Primers</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">Short, direct briefings for CEOs, CFOs, and boards on how the current monetary regime impacts industrial businesses.</p>
          <span className="text-amber-600 text-sm font-semibold">No jargon. No ideology.</span>
        </div>
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200 hover:border-amber-400 transition-colors">
          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Treasury Frameworks</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">Structured ways to stress-test balance sheets against inflation and credit stress, and frame new approaches within fiduciary constraints.</p>
          <span className="text-amber-600 text-sm font-semibold">Protect the engine.</span>
        </div>
        <div onClick={() => setView('data')} className="cursor-pointer bg-white p-8 rounded-sm shadow-sm border border-slate-200 hover:border-amber-400 transition-colors">
          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
            <BarChart3 className="h-6 w-6 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Data & Dashboards</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">Long-horizon views, valuation regime models for hard assets, and sector benchmarks. Designed so you can see assumptions.</p>
          <span className="text-amber-600 text-sm font-semibold">Adapt to your environment.</span>
        </div>
      </div>
    </Section>

    <Section className="bg-slate-900 text-white">
      <div className="grid lg:grid-cols-2 gap-16">
        <div>
          <SectionTitle title="Why This Matters Now" light={true} />
          <div className="text-lg text-slate-300 mb-8 space-y-4 max-w-prose">
            <p>Industrial and chemical businesses are built on long cycles: multi-year capex programs, long-term supply agreements, and balance sheets that must survive credit cycles.</p>
            <p>These are not entities that can pivot quarterly.</p>
          </div>
          <div className="space-y-6">
            <div className="flex"><TrendingUp className="h-6 w-6 text-amber-500 mt-1 mr-4 shrink-0" /><div><h4 className="font-bold text-white">The Backdrop is Shifting</h4><p className="text-slate-400 text-sm mt-1">Aggressive policy moves, volatile real yields, and pressure on long-term obligations.</p></div></div>
            <div className="flex"><Anchor className="h-6 w-6 text-amber-500 mt-1 mr-4 shrink-0" /><div><h4 className="font-bold text-white">A New Stable Anchor</h4><p className="text-slate-400 text-sm mt-1">A resilient balance sheet gives you a more stable anchor for reserves and changes how you think about retained earnings.</p></div></div>
            <div className="flex"><Activity className="h-6 w-6 text-amber-500 mt-1 mr-4 shrink-0" /><div><h4 className="font-bold text-white">Intelligent Conversation</h4><p className="text-slate-400 text-sm mt-1">We exist to make the conversation with boards and owners intelligent, data-driven, and grounded in reality.</p></div></div>
          </div>
        </div>
        <div className="relative h-full min-h-[400px] bg-slate-800 rounded-sm border border-slate-700 p-1 flex flex-col justify-center overflow-hidden">
            <ImageWithFallback 
              src={MONOCHROME_IMAGE_LOCAL} 
              fallback={MONOCHROME_FALLBACK}
              alt="Industrial Resilience" 
              className="w-full h-full object-cover rounded-sm opacity-90 hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute bottom-4 left-4 bg-slate-900/80 px-3 py-1 rounded backdrop-blur-sm">
               <p className="text-white text-xs font-serif italic">"The goal isn’t to bet the company. The goal is to extend your planning horizon."</p>
            </div>
        </div>
      </div>
    </Section>

    <Section className="bg-white">
      <SectionTitle title="Who We Work With" />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "CEOs & Founders", desc: "Of industrial and chemical companies." },
          { title: "CFOs & Treasury", desc: "Leaders responsible for liquidity and risk." },
          { title: "Board Members", desc: "Owners who think in decades, not quarters." },
          { title: "Investors", desc: "Seeking a hard-asset lens on capital-intensive business." },
        ].map((item, i) => (
            <div key={i} className="border-t-4 border-slate-200 pt-4">
                <h4 className="font-bold text-lg text-slate-900">{item.title}</h4>
                <p className="text-slate-600 mt-2 text-sm">{item.desc}</p>
            </div>
        ))}
      </div>
      <div className="mt-12 text-center p-8 bg-slate-50 rounded-lg max-w-3xl mx-auto">
          <p className="text-lg text-slate-800 font-medium">If you’re responsible for real assets, real people, and real P&Ls—and you’re re-thinking how your balance sheet is built—we built this for you.</p>
      </div>
    </Section>

    <Section className="bg-slate-100">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title="How We Work" />
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">1</div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Clarify Your Reality</h3>
                    <p className="text-slate-600 mt-2">Start with your actual balance sheet, cash flows, and constraints—no theoretical templates.</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">2</div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Map the Options</h3>
                    <p className="text-slate-600 mt-2">Use data and frameworks to explore how different reserve and hard-asset strategies could behave under a range of scenarios.</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">3</div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Equip the Decision-Makers</h3>
                    <p className="text-slate-600 mt-2">Help boards, lenders, and key executives see the trade-offs clearly so whatever you decide is informed, defensible, and aligned.</p>
                </div>
            </div>
        </div>
      </div>
    </Section>

    <Section id="faq" className="bg-white">
      <SectionTitle title="Frequently Asked Questions" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Do you recommend Bitcoin?</h4>
                <p className="text-slate-600 text-sm">No. We don’t recommend assets. This project is strictly research-focused and explores long-horizon capital resilience across inflation, credit stress, liquidity, and multi-decade industrial cycles.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Is this investment advice?</h4>
                <p className="text-slate-600 text-sm">No. All content on this site is for educational and informational purposes only. We do not provide individualized investment, legal, tax, or accounting advice.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Do you manage assets or run a fund?</h4>
                <p className="text-slate-600 text-sm">No. We do not manage assets, run a fund, or solicit capital. Our focus is on research, education, and strategic frameworks.</p>
            </div>
        </div>
        <div className="space-y-8">
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Why focus on industrial and chemical businesses?</h4>
                <p className="text-slate-600 text-sm">These businesses are capital-intensive, long-cycle, and highly sensitive to both monetary policy and commodity dynamics. They stand to benefit the most from stronger balance-sheet architecture.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Are you trying to convince every company to adopt this?</h4>
                <p className="text-slate-600 text-sm">No. Some balance sheets and ownership structures are not a good fit. Our goal is to help you see the trade-offs clearly so that if you say “yes” or “no,” it’s for the right reasons.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Can we reuse your models and charts?</h4>
                <p className="text-slate-600 text-sm">In general, yes, with proper attribution. If you want to incorporate them into internal board materials, we encourage you to cite the source and keep the methodology visible.</p>
            </div>
        </div>
      </div>
    </Section>
  </>
);

const ExecutivesView = ({ setView }: NavProps) => (
  <>
    <div className="bg-slate-900 py-24 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block py-1 px-3 rounded-full bg-amber-900/30 border border-amber-700 text-amber-500 text-xs font-bold tracking-wider uppercase mb-6">
            About This Project
        </span>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl max-w-4xl mx-auto mb-6">
          A Hard-Money Lens for <br /><span className="text-slate-400">Industrial Balance Sheets</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          A direct, data-driven view of how Bitcoin behaves over long horizons—and how it can (and cannot) fit into the treasury and capital structure of industrial and chemical businesses.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={() => setView('data')}>View the Models & Dashboards</Button>
          <Button variant="secondary" onClick={() => document.getElementById('exec-overview')?.scrollIntoView({behavior:'smooth'})}>
            Read the Executive Overview
          </Button>
        </div>
        <p className="mt-8 text-sm text-slate-500">Built for leaders responsible for real assets, real people, and real P&Ls.</p>
      </div>
    </div>

    <Section id="exec-overview" className="bg-white">
      <SectionTitle title="What This Is (and Isn't)" />
      <div className="grid md:grid-cols-2 gap-0 border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 p-10 border-b md:border-b-0 md:border-r border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-green-600" /> What This Is
          </h3>
          <ul className="space-y-4">
            {[
              "A practitioner’s framework for hard monetary assets.",
              "Long-horizon data and models.",
              "Connecting industrial reality with monetary reality.",
              "A resource to circulate internally to boards."
            ].map((item, i) => (
              <li key={i} className="flex items-start text-slate-700">
                <span className="text-green-600 font-bold mr-3">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-10">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <X className="w-6 h-6 mr-2 text-red-500" /> What This Is Not
          </h3>
          <ul className="space-y-4">
            {[
              "Not trading tips, memes, or predictions.",
              "Not a fund pitch or ask for capital.",
              "Not a recommendation to 'go all in'.",
              "Not a substitute for your legal/tax teams."
            ].map((item, i) => (
              <li key={i} className="flex items-start text-slate-700">
                <span className="text-red-500 font-bold mr-3">×</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>

    <Section className="bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Why CEOs, CFOs, and Boards Are Looking at Bitcoin</h2>
        <div className="prose prose-lg text-slate-600">
          <p className="mb-4">Senior leaders in industrial and chemical businesses are starting to ask:</p>
          <ul className="list-disc pl-6 mb-8 space-y-2 bg-white p-6 rounded-md shadow-sm border border-slate-200">
            <li>What happens to our cash, reserves, and pensions if monetary expansion continues at this pace?</li>
            <li>How do we protect long-term obligations in a world of volatile real yields?</li>
            <li>Is there a role for a hard, digitally native asset with a transparent issuance schedule alongside our fiat reserves?</li>
          </ul>
          <p className="mb-6">Bitcoin will not fix operations, culture, or strategy. But as a hard monetary asset, it can serve as a long-duration store of value, change the conversation around retained earnings, and provide a contrast to purely fiat-based reserves in board-level risk discussions.</p>
        </div>
      </div>
    </Section>

    <Section className="bg-slate-900 text-white">
      <SectionTitle title="How It Can Fit" subtitle light={true} />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-slate-800 p-8 rounded border-t-4 border-amber-500">
          <h3 className="text-xl font-bold mb-4">1. Strategic Reserves</h3>
          <p className="text-slate-400 text-sm mb-4">A modest, clearly-sized allocation alongside cash and short-duration instruments.</p>
          <ul className="text-sm text-slate-300 space-y-2"><li>• Preserves liquidity</li><li>• Anchor for long-term value</li><li>• Governed by strict thresholds</li></ul>
        </div>
        <div className="bg-slate-800 p-8 rounded border-t-4 border-amber-500">
          <h3 className="text-xl font-bold mb-4">2. Optionality Pool</h3>
          <p className="text-slate-400 text-sm mb-4">A separate “optionality bucket” funded from retained earnings.</p>
          <ul className="text-sm text-slate-300 space-y-2"><li>• Explicitly risk capital</li><li>• 5–10+ year horizons</li><li>• Build long-term resilience</li></ul>
        </div>
        <div className="bg-slate-800 p-8 rounded border-t-4 border-amber-500">
          <h3 className="text-xl font-bold mb-4">3. Board-Level Lens</h3>
          <p className="text-slate-400 text-sm mb-4">Even before purchasing, the analysis itself creates value.</p>
          <ul className="text-sm text-slate-300 space-y-2"><li>• Forces clarity on time horizons</li><li>• Highlights hidden fiat risks</li><li>• Sharpens treasury strategy</li></ul>
        </div>
      </div>
    </Section>

    <Section className="bg-white">
      <div className="grid lg:grid-cols-2 gap-16">
        <div>
          <SectionTitle title="The Models Behind Our View" />
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Long-Horizon Fair-Value</h4>
              <p className="text-slate-600 mt-2">We use power-law models to estimate a long-term “fair value” trajectory. These models are evaluated in log space, where Bitcoin’s behavior is statistically meaningful.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Lower-Valuation Regimes</h4>
              <p className="text-slate-600 mt-2">We pay attention to periods when market price is in the lowest band relative to the model. Historically, these are the most favorable entry points for accumulators.</p>
            </div>
          </div>
          <div className="mt-8">
            <Button onClick={() => setView('data')}>Open the Hard-Money Dashboard</Button>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 flex flex-col items-center justify-center">
             <div className="w-full h-64 relative border-l border-b border-slate-300">
                <div className="absolute bottom-0 left-0 w-full h-full p-4">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                        <path d="M0,50 Q20,40 50,20 T100,5" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M0,50 L10,45 L15,48 L25,35 L30,40 L40,25 L50,15 L60,20 L70,10 L80,12 L90,5 L100,2" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    </svg>
                </div>
             </div>
             <p className="text-xs text-slate-500 mt-4 text-center">Interactive charts allow you to stress-test assumptions and compare against industrial indices.</p>
        </div>
      </div>
    </Section>

    <Section className="bg-slate-100">
      <SectionTitle title="Questions for Your Next Board Meeting" />
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <ul className="space-y-6">
          {[
            "What portion of our balance sheet is truly long-term capital versus working capital?",
            "How are we currently protecting that long-term capital from monetary debasement?",
            "Have we explicitly considered a small, governed allocation to a hard monetary asset?",
            "If not, is that because we evaluated it and declined, or simply haven’t had the discussion?",
            "What governance and risk limits would we require before considering any allocation?"
          ].map((q, i) => (
            <li key={i} className="flex items-start">
               <span className="text-amber-500 font-bold mr-4 text-xl">?</span>
               <span className="text-slate-800 font-medium text-lg">{q}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  </>
);

const DataModelsView = () => {
  const [activeTab, setActiveTab] = useState('powerLaw'); 
  const [plData, setPlData] = useState<any[]>([]);
  const [plLoading, setPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);
  const [plDataSource, setPlDataSource] = useState('Initializing...');
  const [compData, setCompData] = useState<any[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<any[]>([]); 
  const [yScale, setYScale] = useState<'log' | 'linear'>('log');
  const [xScale, setXScale] = useState('date');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [currentFairPrice, setCurrentFairPrice] = useState<number | null>(null);
  const [stdDev, setStdDev] = useState(0);
  const [rSquared, setRSquared] = useState(0);

  const formatXAxis = (val: number) => {
    if (xScale === 'date') return new Date(val).getFullYear().toString();
    const date = new Date(GENESIS_DATE + val * ONE_DAY_MS);
    return date.getFullYear().toString();
  };

  const formatTooltipDate = (label: number) => {
    const date = xScale === 'date' ? new Date(label) : new Date(GENESIS_DATE + label * ONE_DAY_MS);
    return date.toLocaleDateString();
  };

  // Data fetching helper (uses global fetchWithRetry)
  const fetchCoinCapData = async () => {
      const json = await fetchWithRetry('https://api.coincap.io/v2/assets/bitcoin/history?interval=d1');
      if (!json.data) throw new Error('Invalid CoinCap Data');
      return json.data.map((d: any) => ({ date: d.time, price: parseFloat(d.priceUsd) }));
  };

  const fetchYahooData = async (symbol: string, interval = '1d', range = 'max') => {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&_=${new Date().getTime()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Yahoo Proxy Error`);
    const wrapper = await response.json();
    if (!wrapper.contents) throw new Error(`Invalid Proxy Data`);
    const json = JSON.parse(wrapper.contents);
    if (!json.chart?.result?.[0]) throw new Error(`Invalid Yahoo Data`);
    const result = json.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0].close || [];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes;
    return timestamps.map((ts: number, index: number) => ({ date: ts * 1000, price: adjClose[index] }));
  };

  const fetchCoinGeckoData = async () => {
    const json = await fetchWithRetry('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily');
    return json.prices.map(([ts, price]: [number, number]) => ({ date: ts, price: price }));
  };

  const loadPlDemoData = () => {
    const demoData = [];
    const now = Date.now();
    const targetDateMs = new Date(`${PROJECT_TO_YEAR}-12-31`).getTime();
    const daysTotal = (targetDateMs - GENESIS_DATE) / ONE_DAY_MS;
    const fakeStdDev = 0.6; 
    setStdDev(fakeStdDev);
    setRSquared(0.92);

    for (let i = 500; i < daysTotal; i += 30) {
      const timestamp = GENESIS_DATE + (i * ONE_DAY_MS);
      const fair = calculateFairPrice(i);
      let simulatedPrice = null;
      if (timestamp <= now) {
          const cycle = Math.sin(i / 600) * 1.5; 
          const noise = (Math.random() - 0.5) * 0.2;
          simulatedPrice = fair * Math.exp(cycle + noise);
      }
      demoData.push({
        date: timestamp,
        price: simulatedPrice,
        fairPrice: fair,
        daysSinceGenesis: i,
        upperBand: fair * Math.exp(2 * fakeStdDev),
        lowerBand: fair * Math.exp(-1 * fakeStdDev)
      });
    }
    setPlData(demoData);
    const lastReal = demoData.filter(d => d.price !== null).pop();
    if(lastReal) {
        setCurrentPrice(lastReal.price);
        setCurrentFairPrice(lastReal.fairPrice);
    }
  };

  const fetchPowerLawData = async () => {
    setPlLoading(true);
    setPlError(null);
    let rawPoints: any[] = [];
    let sourceName = '';

    try {
      try {
         sourceName = 'CoinCap API';
         rawPoints = await fetchCoinCapData();
      } catch (ccErr) {
         try {
           sourceName = 'Yahoo Finance';
           rawPoints = await fetchYahooData('BTC-USD');
         } catch (yahooErr) {
             sourceName = 'CoinGecko';
             rawPoints = await fetchCoinGeckoData();
         }
      }

      let processedData = rawPoints.map(pt => {
        if (pt.price === null || pt.price === undefined) return null;
        const daysSinceGenesis = (pt.date - GENESIS_DATE) / ONE_DAY_MS;
        const fairPrice = daysSinceGenesis > 0 ? calculateFairPrice(daysSinceGenesis) : 0;
        return { date: pt.date, price: pt.price, fairPrice, daysSinceGenesis };
      }).filter((d): d is { date: number; price: number; fairPrice: number; daysSinceGenesis: number } => d !== null && d.price > 0 && d.fairPrice > 0 && d.daysSinceGenesis > 1);

      if (processedData.length === 0) throw new Error('No valid data');

      const logResiduals = processedData.map(d => Math.log(d.price) - Math.log(d.fairPrice));
      const meanResidual = logResiduals.reduce((sum, val) => sum + val, 0) / logResiduals.length;
      const squaredDiffs = logResiduals.map(val => Math.pow(val - meanResidual, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
      
      setStdDev(Math.sqrt(variance));
      setPlDataSource(sourceName);

      const lastPoint = processedData[processedData.length - 1];
      setCurrentPrice(lastPoint.price);
      setCurrentFairPrice(lastPoint.fairPrice);

      const targetDateMs = new Date(`${PROJECT_TO_YEAR}-12-31`).getTime();
      const futureData = [];
      let nextDateMs = lastPoint.date + ONE_DAY_MS;

      while (nextDateMs <= targetDateMs) {
        const daysSinceGenesis = (nextDateMs - GENESIS_DATE) / ONE_DAY_MS;
        const fairPrice = calculateFairPrice(daysSinceGenesis);
        futureData.push({ date: nextDateMs, price: null, fairPrice, daysSinceGenesis });
        nextDateMs += ONE_DAY_MS;
      }

      const combined = [...processedData, ...futureData].map(d => ({
        ...d,
        upperBand: d.fairPrice * Math.exp(2 * Math.sqrt(variance)), 
        lowerBand: d.fairPrice * Math.exp(-1 * Math.sqrt(variance)),
      }));

      const logActuals = processedData.map(d => Math.log(d.price));
      const meanLogActual = logActuals.reduce((a, b) => a + b, 0) / logActuals.length;
      const ssTot = logActuals.reduce((acc, val) => acc + Math.pow(val - meanLogActual, 2), 0);
      const ssRes = processedData.reduce((acc, d) => acc + Math.pow(Math.log(d.price) - Math.log(d.fairPrice), 2), 0);
      setRSquared(1 - (ssRes / ssTot));

      setPlData(combined);

    } catch (err) {
      setPlError(`Live data unavailable. Using simulated data.`);
      setPlDataSource('Demo Data (Simulation)');
      loadPlDemoData();
    } finally {
      setPlLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (compData.length > 0) return; 
    setCompLoading(true);
    setCompError(null);
    try {
      processComparisonData(STATIC_HISTORY);
    } catch (err) {
      setCompError("Failed to load comparison data.");
    } finally {
      setCompLoading(false);
    }
  };

  const processComparisonData = (historyData: Record<number, Record<string, { start: number; end: number } | null>>) => {
      const years: any[] = [];
      const wins: Record<string, number> = {};
      ASSETS.forEach(a => wins[a.symbol] = 0);
      
      for (let year = START_YEAR; year <= 2025; year++) {
          const yearReturns: any[] = [];
          const yearData = historyData[year];

          if (yearData) {
              ASSETS.forEach(asset => {
                  const stats = yearData[asset.symbol];
                  if (!stats) {
                      yearReturns.push({ ...asset, value: null, startPrice: null, endPrice: null });
                  } else {
                      const percentChange = ((stats.end - stats.start) / stats.start) * 100;
                      yearReturns.push({ ...asset, value: percentChange, startPrice: stats.start, endPrice: stats.end });
                  }
              });

              yearReturns.sort((a, b) => {
                 if (a.value === null) return 1;
                 if (b.value === null) return -1;
                 return b.value - a.value;
              });

              const winner = yearReturns[0].value !== null ? yearReturns[0] : null;
              if (winner) wins[winner.symbol] = (wins[winner.symbol] || 0) + 1;

              years.push({ year, returns: yearReturns, winner });
          }
      }

      const calculateStats = (symbol: string) => {
          const getPrice = (year: number, type: 'start' | 'end') => historyData[year] ? historyData[year][symbol]?.[type] : null;
          const currentEnd = getPrice(2025, 'end');
          
          if (!currentEnd) return { cagr2: null, cagr3: null, cagr5: null, cagr10: null, label10: "10Y", totalReturn: null };

          const p2 = getPrice(2023, 'end');
          const cagr2 = p2 ? (Math.pow(currentEnd / p2, 1/2) - 1) * 100 : null;
          
          const p3 = getPrice(2022, 'end');
          const cagr3 = p3 ? (Math.pow(currentEnd / p3, 1/3) - 1) * 100 : null;
          
          const p5 = getPrice(2020, 'end');
          const cagr5 = p5 ? (Math.pow(currentEnd / p5, 1/5) - 1) * 100 : null;

          let startYear10 = 2016;
          let years10 = 10;
          let label10 = "10Y";
          if (symbol === 'DOW') { startYear10 = 2019; years10 = 2025 - 2019 + 1; label10 = "6Y"; }
          
          const p10 = getPrice(startYear10, 'start');
          const cagr10 = p10 ? (Math.pow(currentEnd / p10, 1/years10) - 1) * 100 : null;
          const totalReturn = p10 ? ((currentEnd - p10) / p10) * 100 : null;
          
          return { cagr2, cagr3, cagr5, cagr10, label10, totalReturn };
      };

      const sortedScoreboard = Object.entries(wins).map(([symbol, count]) => {
            const asset = ASSETS.find(a => a.symbol === symbol)!;
            const stats = calculateStats(symbol);
            return { ...asset, count, ...stats };
      }).sort((a, b) => b.count - a.count);

      setCompData(years);
      setScoreboard(sortedScoreboard);
  };

  useEffect(() => { fetchPowerLawData(); }, []);
  useEffect(() => { if (activeTab === 'comparison') { fetchComparisonData(); } }, [activeTab]);

  const downloadPlCSV = () => {
    if (!plData.length) return;
    const headers = ["Date", "Days", "Price", "Fair Value", "+2 SD", "-1 SD"];
    const rows = plData.map(row => [
      new Date(row.date).toISOString().split('T')[0],
      row.daysSinceGenesis.toFixed(2),
      row.price || "",
      row.fairPrice.toFixed(2),
      row.upperBand.toFixed(2),
      row.lowerBand.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "btc_power_law.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow bg-slate-950 text-slate-200 w-full flex flex-col">
      <div className="w-full px-6 py-8 flex-grow">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-800 backdrop-blur-sm">
             <div className="flex items-center gap-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><LayoutDashboard className="text-amber-500" />Hard Money Dashboard</h2>
                 <div className="h-6 w-px bg-slate-700 mx-2"></div>
                 <div className="flex bg-slate-900 border border-slate-700 rounded-md p-1">
                   <button onClick={() => setActiveTab('powerLaw')} className={`px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'powerLaw' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>Power Law Model</button>
                   <button onClick={() => setActiveTab('comparison')} className={`px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>Industrial Race</button>
                 </div>
             </div>
             <button onClick={activeTab === 'powerLaw' ? fetchPowerLawData : fetchComparisonData} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors" title="Refresh Data"><RefreshCcw size={18} /></button>
          </div>

          {activeTab === 'powerLaw' ? (
             <div className="space-y-6 animate-in fade-in duration-500 w-full">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white border-l-4 border-amber-500 pl-4">Research Dashboard: Long-Horizon Reserve Models</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Actual Price</p><div className="text-2xl font-bold text-white">{currentPrice ? `$${currentPrice.toLocaleString()}` : '---'}</div></div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Fair Value (Model)</p><div className="text-2xl font-bold text-blue-400">{currentFairPrice ? `$${Math.round(currentFairPrice).toLocaleString()}` : '---'}</div></div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Deviation</p><div className={`text-2xl font-bold ${((currentPrice && currentFairPrice) ? ((currentPrice - currentFairPrice) / currentFairPrice) * 100 : 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>{((currentPrice && currentFairPrice) ? ((currentPrice - currentFairPrice) / currentFairPrice) * 100 : 0) > 0 ? '+' : ''}{((currentPrice && currentFairPrice) ? ((currentPrice - currentFairPrice) / currentFairPrice) * 100 : 0).toFixed(1)}%</div></div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Std Dev (σ)</p><div className="text-2xl font-bold text-purple-400">{stdDev.toFixed(3)}</div><div className="text-[10px] text-slate-500">Log-price residuals</div></div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm"><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">R-Squared (R²)</p><div className="text-2xl font-bold text-cyan-400">{rSquared.toFixed(4)}</div><div className="text-[10px] text-slate-500">Model Fit (Log-Log)</div></div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 px-2 w-full">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Database size={14} />Source: <span className={`${plDataSource.includes('Demo') ? 'text-yellow-500' : 'text-green-400'} font-medium`}>{plDataSource}</span></div>
                  <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"><span>Y-Axis</span><div className="flex bg-slate-900 border border-slate-800 rounded overflow-hidden"><button onClick={() => setYScale('log')} className={`px-2 py-1 ${yScale === 'log' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>Log</button><button onClick={() => setYScale('linear')} className={`px-2 py-1 ${yScale === 'linear' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>Lin</button></div></div></div>
                      <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"><span>X-Axis</span><div className="flex bg-slate-900 border border-slate-800 rounded overflow-hidden"><button onClick={() => setXScale('log-days')} className={`px-2 py-1 ${xScale === 'log-days' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>Log</button><button onClick={() => setXScale('date')} className={`px-2 py-1 ${xScale === 'date' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>Time</button></div></div></div>
                  </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[60vh] min-h-[600px] shadow-2xl relative flex flex-col w-full">
                  <div className="flex justify-between items-center mb-2 px-2">
                      <h2 className="text-sm font-semibold text-slate-400">BTC Power Law Projection (2009 - {PROJECT_TO_YEAR})</h2>
                      <div className="flex gap-4 text-xs">
                          <span className="flex items-center gap-1 text-red-400"><div className="w-2 h-2 rounded-full bg-red-400/50"/> +2σ (Upper)</span>
                          <span className="flex items-center gap-1 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400"/> Model</span>
                          <span className="flex items-center gap-1 text-green-400"><div className="w-2 h-2 rounded-full bg-green-400/50"/> -1σ (Lower)</span>
                      </div>
                  </div>
                  {plLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3"><Loader2 className="animate-spin" size={32} /><p>Fetching Power Law data...</p></div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={plData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis dataKey={xScale === 'date' ? 'date' : 'daysSinceGenesis'} tickFormatter={formatXAxis} stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={50} type="number" scale={xScale === 'date' ? 'time' : 'log'} domain={['dataMin', 'dataMax']} allowDataOverflow={true}/>
                      <YAxis scale={yScale} domain={['auto', 'auto']} tickFormatter={formatCurrency} stroke="#64748b" tick={{ fontSize: 11 }} width={60} allowDataOverflow={true}/>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} labelFormatter={formatTooltipDate} formatter={(value, name) => { if (value === null) return ['-', name]; let label = name; if (name === 'upperBand') label = 'Upper Band (+2σ)'; if (name === 'lowerBand') label = 'Lower Band (-1σ)'; return [`$${Number(value).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, label]; }}/>
                      <Line type="monotone" dataKey="upperBand" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="upperBand" />
                      <Line type="monotone" dataKey="lowerBand" stroke="#22c55e" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="lowerBand" />
                      <Line type="monotone" dataKey="fairPrice" stroke="#60a5fa" strokeWidth={2} dot={false} name="Fair Value" isAnimationActive={false} />
                      <Line type="monotone" dataKey="price" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Actual Price" isAnimationActive={false} connectNulls={false} />
                      </ComposedChart>
                  </ResponsiveContainer>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-400 bg-slate-900/30 p-6 rounded-xl border border-slate-800 w-full">
                  <div><h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Settings size={14} /> Model Settings</h3><ul className="space-y-1 list-disc list-inside text-slate-500 text-xs"><li>Coeff: {MODEL_COEFF}</li><li>Exponent: {MODEL_EXPONENT}</li></ul></div>
                  <div className="flex items-end justify-end"><button onClick={downloadPlCSV} className="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-md transition-colors border border-slate-700"><Download size={14} /> Export CSV</button></div>
              </div>
             </div>
          ) : (
              <div className="space-y-8 animate-in fade-in duration-500 w-full">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white border-l-4 border-amber-500 pl-4">Industry Cycle Comparison: 2010–2025</h2></div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center"><h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3"><FlaskConical className="text-purple-500" />Bitcoin vs. Chemical Industry</h2><p className="text-slate-400 text-sm max-w-2xl mx-auto">Year-over-Year (YoY) growth comparison starting from {START_YEAR}. Tracks Bitcoin against major chemical companies and funds: Dow, BASF, Celanese, Methanex, and FSCHX.</p></div>
              {compLoading && (<div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4"><Loader2 className="animate-spin" size={48} /><p>Crunching historical data for 6 assets...</p></div>)}
              {compError && (<div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-200 p-6 rounded-lg text-center"><AlertCircle className="mx-auto mb-2" size={32} />{compError}</div>)}
              {!compLoading && (
                  <>
                  <div className="grid grid-cols-1 gap-6 w-full">
                      {compData.map((yearData) => (
                      <div key={yearData.year} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                          <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                          <span className="font-bold text-white text-lg">{yearData.year}</span>
                          {yearData.winner && (<span className="text-xs font-medium px-2 py-1 rounded bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 flex items-center gap-1"><Trophy size={12} />Winner: {yearData.winner.name}</span>)}
                          </div>
                          <div className="p-4"><div className="flex flex-col gap-2">
                              {yearData.returns.map((item, idx) => (
                              <div key={item.symbol} className="relative flex items-center h-10">
                                  <div className="w-24 text-xs font-medium text-slate-400 shrink-0 truncate pr-2 flex flex-col justify-center"><span>{item.name}</span></div>
                                  <div className="w-28 text-[10px] text-slate-500 shrink-0 flex flex-col justify-center mr-2 border-l border-slate-800 pl-2 leading-tight">
                                      {item.startPrice !== null ? (<><div className="flex justify-between"><span className="text-slate-600 mr-1">Start:</span><span className="text-slate-300">{formatPrice(item.startPrice)}</span></div><div className="flex justify-between"><span className="text-slate-600 mr-1">End:</span><span className="text-slate-300">{formatPrice(item.endPrice)}</span></div></>) : <span className="text-slate-700">--</span>}
                                  </div>
                                  <div className="flex-1 h-6 bg-slate-800/50 rounded-r-sm relative overflow-hidden flex items-center">
                                  {item.value !== null ? (<><div className="h-full absolute left-0 top-0 opacity-80 transition-all duration-500" style={{ width: `${Math.min(Math.abs(item.value), 100)}%`, backgroundColor: item.value >= 0 ? item.color : '#ef4444' }}/><span className="relative z-10 ml-2 text-xs font-bold text-white drop-shadow-md">{item.value > 0 ? '+' : ''}{item.value.toFixed(1)}%</span></>) : (<span className="ml-2 text-xs text-slate-600 italic">N/A</span>)}
                                  </div>
                              </div>
                              ))}
                          </div></div>
                      </div>
                      ))}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8 w-full">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4"><Trophy className="text-yellow-500" />Decade Scoreboard ({START_YEAR} - Present)</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                          {Array.isArray(scoreboard) && scoreboard.map((item, index) => (
                          <div key={item.symbol} className={`relative p-4 rounded-lg border flex flex-col items-center text-center ${index === 0 ? 'bg-yellow-900/10 border-yellow-500/50' : 'bg-slate-800/30 border-slate-700'}`}>
                              {index === 0 && <div className="absolute -top-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">CHAMPION</div>}
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2 shadow-lg" style={{ backgroundColor: item.color }}>{item.symbol === 'BTC-USD' ? '₿' : item.symbol[0]}</div>
                              <div className="text-2xl font-bold text-white">{item.count}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Wins</div>
                              <div className="text-xs font-medium text-slate-300 mt-2 truncate w-full" title={item.name}>{item.name}</div>
                              <div className="mt-3 pt-3 border-t border-slate-700 w-full text-[10px] space-y-1">
                                  <div className="flex justify-between text-slate-400 items-center"><span>2Y CAGR:</span><span className={item.cagr2 >= 0 ? 'text-green-400' : 'text-red-400'}>{item.cagr2 !== null ? `${item.cagr2.toFixed(1)}%` : 'N/A'}</span></div>
                                  <div className="flex justify-between text-slate-400 items-center"><span>3Y CAGR:</span><span className={item.cagr3 >= 0 ? 'text-green-400' : 'text-red-400'}>{item.cagr3 !== null ? `${item.cagr3.toFixed(1)}%` : 'N/A'}</span></div>
                                  <div className="flex justify-between text-slate-400 items-center"><span>5Y CAGR:</span><span className={item.cagr5 >= 0 ? 'text-green-400' : 'text-red-400'}>{item.cagr5 !== null ? `${item.cagr5.toFixed(1)}%` : 'N/A'}</span></div>
                                  <div className="flex justify-between text-slate-400 items-center"><span title={item.symbol === 'DOW' ? 'Since 2019' : '10 Year'}>{item.symbol === 'DOW' ? '6Y' : '10Y'} CAGR:</span><span className={item.cagr10 >= 0 ? 'text-green-400' : 'text-red-400'}>{item.cagr10 !== null ? `${item.cagr10.toFixed(1)}%` : 'N/A'}</span></div>
                                  <div className="flex justify-between text-slate-400 items-center border-t border-slate-800 pt-1 mt-1"><span>Total:</span><span className={item.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>{item.totalReturn !== null ? `${item.totalReturn.toFixed(0)}%` : 'N/A'}</span></div>
                              </div>
                          </div>
                          ))}
                      </div>
                  </div>
                  </>
              )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 6. APP (Defined Last) ---

const App = () => {
  const [currentView, setView] = useState('home');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  return (
    <>
    <style>{`
      :root { max-width: none !important; }
      body { display: block !important; min-width: 0 !important; place-items: unset !important; }
      #root { max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; width: 100% !important; }
    `}</style>
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-amber-200 flex flex-col">
      <Navbar currentView={currentView} setView={setView} />
      
      <main className="flex-grow flex flex-col w-full relative">
        {currentView === 'home' && <HomeView setView={setView} />}
        {currentView === 'executives' && <ExecutivesView setView={setView} />}
        {currentView === 'data' && <DataModelsView />}
      </main>
      
      <Footer />
    </div>
    </>
  );
};

export default App;