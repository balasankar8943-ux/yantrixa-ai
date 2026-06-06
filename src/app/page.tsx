import Link from 'next/link';
import {
  Zap,
  Code2,
  ImagePlus,
  Brain,
  Layers,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Streaming responses delivered in real-time. Watch answers appear as they are generated — no waiting around.',
  },
  {
    icon: Code2,
    title: 'Code Generation',
    description:
      'Generate, debug, and refactor code with syntax-highlighted output and one-click copy to clipboard.',
  },
  {
    icon: ImagePlus,
    title: 'Multi-Modal',
    description:
      'Upload images, documents, and files to enrich your conversations. Visual understanding built in.',
  },
  {
    icon: Brain,
    title: 'Smart Memory',
    description:
      'Full conversation history with context-aware responses. Pick up right where you left off.',
  },
  {
    icon: Layers,
    title: 'Multiple Models',
    description:
      'Choose from a range of AI models to match your needs — from fast drafts to deep reasoning.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Your data stays yours. End-to-end encryption and strict privacy controls keep conversations safe.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <Sparkles size={16} />
          Powered by next-gen AI
        </div>

        <img
          src="/images/logo.png"
          alt="Yantrixa AI Logo"
          width={90}
          height={90}
          style={{
            marginBottom: 24,
            borderRadius: 'var(--radius-lg)',
            animation: 'slideUp 0.6s ease 0.05s both',
          }}
        />

        <h1 className="hero-title">
          <span className="text-gradient">Yantrixa AI</span>
        </h1>

        <p className="hero-subtitle">
          Experience the next generation of AI conversation. Blazing-fast,
          multi-modal, and beautifully designed.
        </p>

        <div className="hero-actions">
          <Link href="/chat" className="btn-primary">
            <span>Start Chatting</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">
          Everything you need,{' '}
          <span className="text-gradient">nothing you don&apos;t</span>
        </h2>
        <p className="section-subtitle">
          A thoughtfully crafted AI platform designed for speed, power, and
          delight.
        </p>

        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="feature-card animate-slide-up"
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                <div className="feature-icon">
                  <Icon size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} Yantrixa AI. Built by{' '}
          <a
            href="https://yantrixa.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', fontWeight: 500 }}
          >
            Yantrixa.in
          </a>
        </p>
      </footer>
    </>
  );
}
