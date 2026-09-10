import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, userData, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a2535] bg-[#080c10]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-[#00ff88] flex items-center justify-center">
            <span className="text-[#080c10] font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              {"{}"}
            </span>
          </div>
          <span
            className="text-xl font-bold tracking-widest uppercase text-[#e8edf2] flicker"
            style={{ fontFamily: "var(--font-display)" }}
          >
            DSA<span className="text-[#00ff88] text-glow-green">PvP</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="#"
            className="px-4 py-2 text-sm text-[#6b8299] hover:text-[#e8edf2] transition-colors duration-200"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Contact Us
          </a>
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-sm font-semibold text-[#e8edf2]">{userData?.username || user.displayName}</span>
                <img src={userData?.photoURL || user.photoURL || "/src/images/robot.png"} alt="Avatar" className="w-8 h-8 rounded-full border border-[#1a2535]" />
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-[#6b8299] hover:text-[#ff4757] border border-[#1a2535] rounded hover:border-[#ff475744] transition-all duration-200"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 text-sm text-[#6b8299] hover:text-[#e8edf2] border border-[#1a2535] rounded hover:border-[#00ff8844] transition-all duration-200"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Sign In
              </button>
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 text-sm font-semibold text-[#080c10] bg-[#00ff88] rounded hover:bg-[#00cc6a] transition-colors duration-200"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#6b8299] hover:text-[#e8edf2]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#1a2535] bg-[#080c10] px-6 py-4 flex flex-col gap-3">
          <a href="#" className="text-sm text-[#6b8299] hover:text-[#e8edf2] py-2">Contact Us</a>
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-3 py-2 border-t border-[#1a2535] hover:bg-[#1a2535]/30">
                <img src={userData?.photoURL || user.photoURL || "/src/images/robot.png"} alt="Avatar" className="w-8 h-8 rounded-full border border-[#1a2535]" />
                <span className="text-sm text-[#e8edf2]">{userData?.username || user.displayName}</span>
              </Link>
              <button onClick={signOut} className="text-sm text-left text-[#ff4757] hover:text-red-400 py-2">Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={signInWithGoogle} className="text-sm text-left text-[#6b8299] hover:text-[#e8edf2] py-2">Sign In</button>
              <button onClick={signInWithGoogle} className="text-sm font-semibold text-[#080c10] bg-[#00ff88] rounded px-4 py-2 text-center">Sign Up</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const navigate = useNavigate();
  const [arenaCode, setArenaCode] = useState(
    "ARENA-" + Math.random().toString(36).substring(2, 6).toUpperCase()
  );

  const handleJoin = () => {
    if (code) {
      navigate("/arena/" + code);
    }
  };

  const handleCreate = () => {
    navigate("/arena/" + arenaCode);
  };

  return (
    <section className="relative min-h-screen grid-bg flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-20"
        aria-hidden="true"
      >
        <div
          className="w-full h-px bg-gradient-to-r from-transparent via-[#00ff88] to-transparent"
          style={{ animation: "scan-line 8s linear infinite" }}
        />
      </div>

      {/* Badge */}
      <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-[#00ff8830] bg-[#00ff8808]">
        <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <span className="text-xs text-[#00ff88] tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          Competitive Coding Arena
        </span>
      </div>

      {/* Headline */}
      <h1
        className="text-center text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span className="text-[#e8edf2]">CODE.</span>{" "}
        <span className="text-[#00ff88] text-glow-green">DUEL.</span>{" "}
        <span className="text-[#e8edf2]">DOMINATE.</span>
      </h1>

      <p
        className="text-center text-[#6b8299] text-base md:text-lg max-w-xl mb-12 leading-relaxed"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Challenge friends to real-time DSA battles. Solve faster, think sharper,
        and prove your algorithm supremacy — head to head.
      </p>

      {/* Card */}
      <div className="w-full max-w-md card-arena rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#1a2535]">
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors duration-200 ${activeTab === "join"
              ? "text-[#00ff88] border-b-2 border-[#00ff88] bg-[#00ff8808]"
              : "text-[#6b8299] hover:text-[#e8edf2]"
              }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Join a Battle
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-4 text-sm font-semibold tracking-wider uppercase transition-colors duration-200 ${activeTab === "create"
              ? "text-[#00d4ff] border-b-2 border-[#00d4ff] bg-[#00d4ff08]"
              : "text-[#6b8299] hover:text-[#e8edf2]"
              }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create Arena
          </button>
        </div>

        <div className="p-6">
          {activeTab === "join" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-xs text-[#6b8299] uppercase tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Enter Team Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onClick={(e) => {
                    setCode("ARENA-")
                  }}
                  placeholder="e.g. ARENA-7X4K"
                  maxLength={12}
                  className="w-full bg-[#080c10] border border-[#1a2535] rounded-lg px-4 py-3 text-[#e8edf2] placeholder-[#2d3f52] focus:outline-none focus:border-[#00ff8855] focus:ring-1 focus:ring-[#00ff8833] transition-all duration-200 text-base"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
              <button
                onClick={handleJoin}
                className="w-full py-3 rounded-lg bg-[#00ff88] hover:bg-[#00cc6a] text-[#080c10] font-bold text-sm tracking-widest uppercase transition-all duration-200 glow-green"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Enter Arena →
              </button>
              <p className="text-center text-xs text-[#2d3f52]" style={{ fontFamily: "var(--font-body)" }}>
                Get the code from your opponent to join their battle room
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-[#080c10] border border-[#1a2535]">
                <p className="text-xs text-[#6b8299] uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                  Your Arena Code
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-2xl font-bold text-[#00d4ff] text-glow-blue tracking-widest"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {arenaCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(arenaCode)
                      window.alert('Arena Code Copied');
                    }}
                    className="text-xs text-[#6b8299] hover:text-[#00d4ff] border border-[#1a2535] hover:border-[#00d4ff44] rounded px-3 py-1.5 transition-all duration-200"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-lg border-2 border-[#00d4ff44] bg-[#00d4ff08] hover:bg-[#00d4ff14] text-[#00d4ff] font-bold text-sm tracking-widest uppercase transition-all duration-200"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Join Arena →
              </button>
              <p className="text-center text-xs text-[#2d3f52]" style={{ fontFamily: "var(--font-body)" }}>
                Share this code with your opponent and wait for them to join
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
        {[
          { label: "Active Battles", value: "NA" },
          { label: "Problems", value: "NA" },
          { label: "Players Online", value: "NA" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div
              className="text-2xl md:text-3xl font-bold text-[#00ff88] text-glow-green"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {value}
            </div>
            <div
              className="text-xs text-[#6b8299] uppercase tracking-widest mt-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: "⚔️",
      title: "1v1 Code Duels",
      desc: "Go head-to-head with a real opponent. Same problem, same clock — first correct solution wins.",
    },
    {
      icon: "🏆",
      title: "Team Battles",
      desc: "Form squads and compete in group arenas. Coordinate strategy, divide problems, claim victory.",
    },
    {
      icon: "📊",
      title: "Live Leaderboard",
      desc: "Real-time rankings update as solutions are submitted. Watch your position climb in live battles.",
    },
    {
      icon: "🧩",
      title: "Curated Problems",
      desc: "1,200+ hand-picked DSA problems across arrays, graphs, DP, trees, and more — all rated by difficulty.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <p className="text-xs text-[#00ff88] uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          Why DSA PvP
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold text-[#e8edf2]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Built for Competitive Coders
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(({ icon, title, desc }) => (
          <div key={title} className="card-arena rounded-xl p-6">
            <div className="text-3xl mb-4">{icon}</div>
            <h3
              className="text-lg font-bold text-[#e8edf2] mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h3>
            <p className="text-sm text-[#6b8299] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1a2535] py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span
          className="text-sm font-bold tracking-widest text-[#2d3f52] uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DSA<span className="text-[#00ff8844]">PvP</span>
        </span>
        <p className="text-xs text-[#2d3f52]" style={{ fontFamily: "var(--font-mono)" }}>
          © 2026 DSAPvP. All rights reserved.
        </p>
        <div className="flex gap-6">
          {["Terms", "Privacy", "Contact"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-[#2d3f52] hover:text-[#6b8299] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-full bg-[#080c10]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
