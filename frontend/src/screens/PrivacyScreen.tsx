import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Terminal, Lock, Eye } from 'lucide-react';

export const PrivacyScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-hud-bg text-hud-text font-sans flex flex-col justify-between">
      {/* Top navigation */}
      <header className="border-b border-hud-border bg-black/70 backdrop-blur-sm sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 border border-hud-cyan/60 rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-hud-cyan/80" />
            </div>
            <span className="font-mono text-xs tracking-widest text-hud-cyan font-bold">BHUDRISHTI</span>
          </Link>
          <span className="text-hud-muted text-xs">/</span>
          <span className="font-mono text-xs text-hud-muted tracking-wider">PRIVACY POLICY</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/console"
            className="flex items-center gap-2 px-3 py-1.5 border border-hud-cyan/40 bg-hud-cyan/10 text-hud-cyan hover:bg-hud-cyan/20 text-xs font-mono tracking-wider rounded transition-colors"
          >
            <Terminal size={13} />
            <span>OPEN CONSOLE</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-mono text-hud-muted hover:text-hud-text transition-colors"
          >
            <ArrowLeft size={13} />
            <span>BACK TO HOME</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-10">
        {/* Document Header */}
        <div className="space-y-3 border-b border-hud-border pb-8">
          <div className="flex items-center gap-2 text-hud-cyan font-mono text-xs tracking-widest">
            <Shield size={14} />
            <span>DATA GOVERNANCE & PRIVACY STATEMENT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-white tracking-wide">
            BhuDrishti Privacy Policy
          </h1>
          <p className="text-xs font-mono text-hud-muted">
            Effective Date: October 2024 · Document Version 1.2 · Security Protocol Compliant
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>01.</span> Scope and Overview
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            This Privacy Policy governs the manner in which the BhuDrishti Geospatial Intelligence Platform collects,
            utilizes, retains, and secures imagery data, natural language analytical queries, and operational telemetry
            generated during user sessions within the web application and associated API endpoints.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>02.</span> Satellite Imagery and Raster Uploads
          </h2>
          <div className="p-4 border border-hud-border bg-black/40 rounded space-y-2 text-sm text-hud-text/90 leading-relaxed">
            <p>
              When you upload satellite scenes, aerial orthophotos, or Synthetic Aperture Radar (SAR) rasters through
              the BhuDrishti interface:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs font-mono text-hud-muted">
              <li>Uploads are held in ephemeral working memory allocated to your unique session identifier.</li>
              <li>Files are sanitized for MIME type, dimensions, and buffer limits prior to processing.</li>
              <li>BhuDrishti does not claim proprietary ownership over imagery uploaded by users.</li>
              <li>Session imagery is flushed upon session reset, page closure, or container restart.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>03.</span> Natural Language Queries and Inference Telemetry
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            Natural-language prompts submitted through the command bar (e.g., requests to identify infrastructure,
            measure water boundaries, or calculate vegetation differences) are transmitted to the analysis API to
            execute task classification and generate structured telemetry.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 border border-hud-border/70 bg-black/30 rounded">
              <div className="flex items-center gap-2 text-xs font-mono text-hud-cyan mb-1">
                <Lock size={12} />
                <span>NO ADVERTISING PROFILING</span>
              </div>
              <p className="text-xs text-hud-muted">
                Your queries and geospatial interest regions are never sold to data brokers or used for targeted commercial advertisements.
              </p>
            </div>
            <div className="p-3 border border-hud-border/70 bg-black/30 rounded">
              <div className="flex items-center gap-2 text-xs font-mono text-hud-cyan mb-1">
                <Eye size={12} />
                <span>ISOLATED SESSION BOUNDS</span>
              </div>
              <p className="text-xs text-hud-muted">
                Analytical results are isolated per session UUID and are not broadcast across unauthenticated network boundaries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>04.</span> Demonstration and Synthetic Data Disclosures
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            In demonstration mode, sample scenes bundled with the platform (including Sentinel-2A optical samples,
            RISAT/Sentinel-1 SAR samples, and Cartosat-2S bi-temporal pairs) are public domain or open-access reference
            acquisitions used solely for algorithmic illustration. Derived metrics (such as simulated spectral indices,
            confidence scores, and bounding boxes) are calculated deterministically for educational and evaluation purposes.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>05.</span> Local Storage and Client-Side State
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            The platform utilizes browser memory and client-side storage solely to preserve interface state,
            such as selected sensor filter modes, query history, and zoom coordinates. No third-party tracking
            pixels or persistent invasive cookies are embedded into the console interface.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>06.</span> Security and Network Safeguards
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            All API transmissions are designed to run over encrypted TLS/HTTPS protocols in production deployments.
            CORS policies are configured to enforce safe origin restrictions, and backend exceptions are sanitized
            to prevent exposure of internal infrastructure traces.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>07.</span> Contact & Compliance Inquiries
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            For technical inquiries, audit requests, or data protection questions regarding the BhuDrishti project,
            please open an issue or communication request through the official GitHub project repository.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-black/80 px-6 py-6 text-center text-xs font-mono text-hud-muted space-y-2">
        <div className="flex items-center justify-center gap-6">
          <Link to="/" className="hover:text-hud-cyan transition-colors">HOME</Link>
          <Link to="/console" className="hover:text-hud-cyan transition-colors">ANALYSIS CONSOLE</Link>
          <Link to="/privacy" className="text-hud-cyan">PRIVACY POLICY</Link>
          <Link to="/terms" className="hover:text-hud-cyan transition-colors">TERMS OF SERVICE</Link>
        </div>
        <div>BHUDRISHTI GEOSPATIAL PLATFORM · OPEN SENSING SYSTEM</div>
      </footer>
    </div>
  );
};
