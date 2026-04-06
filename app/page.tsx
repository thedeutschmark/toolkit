import Link from "next/link";
import { ArrowRight, Bell, ExternalLink, Heart, ListMusic, MonitorPlay, Music2, Users } from "lucide-react";

const features = [
  {
    icon: Music2,
    title: "Now Playing widget",
    description: "Live Spotify track display for OBS scenes and stream overlays.",
  },
  {
    icon: ListMusic,
    title: "Stream music controls",
    description: "Chat commands for song requests, skips, and playlist capture.",
  },
  {
    icon: MonitorPlay,
    title: "Scene setup",
    description: "Starting Soon and Ending Soon overlays with configurable copy and timing.",
  },
  {
    icon: Heart,
    title: "Supporter wall",
    description: "A live support wall with a public spot price that rises after every paid claim.",
    href: "/supporters",
  },
  {
    icon: Users,
    title: "Collab Planner",
    description: "Stream collab planning, raiding, and scheduling — separate app, shared backend.",
    href: "https://collab.deutschmark.online",
  },
  {
    icon: Bell,
    title: "Alert! Alert!",
    description: "Desktop stream alert tooling distributed separately from the dashboard runtime.",
    href: "https://github.com/thedeutschmark/alert-alert",
  },
];

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans), Inter, -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased" as React.CSSProperties["WebkitFontSmoothing"],
      }}
    >
      {/* Nav */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          borderBottom: "1px solid var(--toolkit-border)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span aria-hidden="true" className="toolkit-rack-light">
            <span className="toolkit-rack-light-core" />
            <span className="toolkit-rack-light-bloom" />
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--toolkit-text-strong)",
            }}
          >
            deutschmark toolkit
          </span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            href="/supporters"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--toolkit-text-muted)",
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
          >
            Supporters
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--toolkit-text-muted)",
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
          >
            Dashboard
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 64px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--toolkit-text-dim)",
            marginBottom: "20px",
          }}
        >
          streaming toolkit
        </p>

        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            color: "var(--toolkit-text-strong)",
            margin: "0 0 20px",
            maxWidth: "820px",
          }}
        >
          Tools built for<br />streamers by a streamer.
        </h1>

        <p
          style={{
            fontSize: "clamp(0.875rem, 2vw, 1rem)",
            lineHeight: 1.7,
            color: "var(--toolkit-text-muted)",
            maxWidth: "420px",
            margin: "0 0 36px",
          }}
        >
          Widget delivery, Spotify integration, and browser-source setup — built for the stream.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 20px",
              height: "44px",
              borderRadius: "10px",
              border: "1px solid rgba(var(--toolkit-accent-rgb), 0.28)",
              background: "linear-gradient(180deg, rgba(var(--toolkit-accent-rgb), 0.18), rgba(var(--toolkit-accent-rgb), 0.11))",
              color: "var(--toolkit-text-strong)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "border-color 180ms ease, box-shadow 180ms ease",
            }}
          >
            Open dashboard
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/supporters"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 20px",
              height: "44px",
              borderRadius: "10px",
              border: "1px solid var(--toolkit-border-strong)",
              background: "var(--toolkit-bg-subtle)",
              color: "var(--toolkit-text-strong)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Supporter wall
          </Link>
        </div>

        {/* Features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginTop: "72px",
            width: "100%",
            maxWidth: "860px",
            textAlign: "left",
          }}
        >
          {features.map(({ icon: Icon, title, description, href }) => {
            const isInternal = Boolean(href?.startsWith("/"));
            const card = (
              <div
                key={title}
                style={{
                  padding: "20px",
                  borderRadius: "14px",
                  border: "1px solid var(--toolkit-border)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0)), var(--toolkit-bg-panel)",
                  height: "100%",
                  transition: href ? "border-color 180ms ease" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <Icon size={16} color="var(--toolkit-text-dim)" />
                  {href && !isInternal ? <ExternalLink size={12} color="var(--toolkit-text-dim)" /> : null}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--toolkit-text-strong)",
                    marginBottom: "6px",
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--toolkit-text-muted)" }}>
                  {description}
                </p>
              </div>
            );

            if (!href) {
              return <div key={title}>{card}</div>;
            }

            return isInternal ? (
              <Link key={title} href={href} style={{ textDecoration: "none" }}>
                {card}
              </Link>
            ) : (
              <a key={title} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                {card}
              </a>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "20px 28px",
          borderTop: "1px solid var(--toolkit-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: "12px", color: "var(--toolkit-text-dim)" }}>
          © 2025 deutschmark
        </p>
        <a
          href="https://discord.com/invite/hQEQE9myXX"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: "12px", color: "var(--toolkit-text-dim)", textDecoration: "none" }}
        >
          Discord
        </a>
      </footer>
    </div>
  );
}
