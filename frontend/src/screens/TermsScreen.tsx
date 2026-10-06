import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Terminal, AlertTriangle } from 'lucide-react';

export const TermsScreen: React.FC = () => {
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
          <span className="font-mono text-xs text-hud-muted tracking-wider">TERMS OF SERVICE</span>
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
            <FileText size={14} />
            <span>TERMS OF SERVICE & USAGE AGREEMENT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-white tracking-wide">
            BhuDrishti Terms of Service
          </h1>
          <p className="text-xs font-mono text-hud-muted">
            Effective Date: October 2024 · Version 1.2 · Geospatial Software Standards
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>01.</span> Agreement and Acceptance
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            By accessing or operating the BhuDrishti platform, API endpoints, or associated tooling, you agree
            to be bound by these Terms of Service. If you do not agree with any provision stated herein, you must
            discontinue use of the application immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>02.</span> Platform Purpose and Capabilities
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            BhuDrishti is an open geospatial analysis and remote sensing intelligence interface providing natural
            language querying, optical and SAR raster co-registration, and bi-temporal change detection telemetry.
            The system is designed for technical evaluation, academic study, and operational workflow demonstration.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>03.</span> Demonstration Notice and Calculation Disclaimers
          </h2>
          <div className="p-4 border border-hud-amber/40 bg-hud-amber/5 rounded space-y-2 text-sm text-hud-text leading-relaxed">
            <div className="flex items-center gap-2 text-xs font-mono text-hud-amber font-semibold">
              <AlertTriangle size={14} />
              <span>CRITICAL DISCLAIMER REGARDING DEMO & SYNTHETIC METRICS</span>
            </div>
            <p className="text-xs text-hud-muted leading-relaxed">
              In demonstration mode, analysis outputs, bounding box locations, confidence scores, and spectral indices
              are deterministic simulations designed for architectural demonstration and interface evaluation. Unless
              explicitly connected to certified production satellite processing pipelines and authenticated sensors:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs font-mono text-hud-muted">
              <li>Do not rely on this system as the sole basis for life-critical navigation, emergency evacuation, or tactical defense.</li>
              <li>Always cross-reference outputs with verified ground truth and certified GIS datasets.</li>
              <li>Outputs are provided on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis without warranty of any kind.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>04.</span> Acceptable Use & Conduct Restrictions
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            Users agree not to utilize the platform or its APIs to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs font-mono text-hud-muted">
            <li>Upload unauthorized classified imagery or materials that infringe third-party intellectual property rights.</li>
            <li>Conduct denial-of-service attacks, port scanning, or malicious automated abuse against backend instances.</li>
            <li>Misrepresent demonstration or synthetic metrics as certified governmental or commercial audits.</li>
            <li>Attempt to bypass API rate limits or input sanitization firewalls.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>05.</span> Intellectual Property & Attribution
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            The BhuDrishti software codebase, custom UI components, styling systems, and technical documentation
            are maintained under open source repository guidelines. Satellite imagery samples bundled from the Copernicus
            Sentinel programme (ESA), ISRO, or USGS remain subject to their respective open data dissemination policies.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>06.</span> Limitation of Liability
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            In no event shall the authors, maintainers, or contributors of BhuDrishti be liable for any direct, indirect,
            incidental, special, consequential, or punitive damages arising out of the use of, or inability to use,
            the software, raster computations, or derived analytical outputs.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-mono font-semibold text-hud-cyan flex items-center gap-2">
            <span>07.</span> Governing Terms and Updates
          </h2>
          <p className="text-sm text-hud-text/90 leading-relaxed">
            These terms may be updated periodically to reflect ongoing feature additions or regulatory revisions. Continued
            use of the platform following any modifications constitutes acceptance of the revised terms.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-black/80 px-6 py-6 text-center text-xs font-mono text-hud-muted space-y-2">
        <div className="flex items-center justify-center gap-6">
          <Link to="/" className="hover:text-hud-cyan transition-colors">HOME</Link>
          <Link to="/console" className="hover:text-hud-cyan transition-colors">ANALYSIS CONSOLE</Link>
          <Link to="/privacy" className="hover:text-hud-cyan transition-colors">PRIVACY POLICY</Link>
          <Link to="/terms" className="text-hud-cyan">TERMS OF SERVICE</Link>
        </div>
        <div>BHUDRISHTI GEOSPATIAL PLATFORM · OPEN SENSING SYSTEM</div>
      </footer>
    </div>
  );
};
