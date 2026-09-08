import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#080c10] flex items-center justify-center text-[#e8edf2]">
        Loading profile...
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#080c10] grid-bg py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-[#6b8299] hover:text-[#e8edf2] transition-colors text-sm font-semibold flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <button
            onClick={handleLogout}
            className="text-[#ff4757] hover:text-red-400 transition-colors text-sm font-semibold border border-[#ff475744] hover:border-[#ff4757] px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="card-arena rounded-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            <img
              src={userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`}
              alt="Avatar"
              className="w-32 h-32 rounded-xl border-2 border-[#00ff8844] object-cover"
            />

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-row gap-100">
                <h1 className="text-4xl font-bold text-[#e8edf2] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {userData.username}
                </h1>
                <button className="rounded-3xl border-2 border-green-600 p-2"
                  onClick={() => console.log("Change username")}
                >Change username</button>
              </div>


              <p className="text-[#6b8299] text-sm mb-4">
                Member since {new Date(userData.createdAt).toLocaleDateString()}
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00d4ff30] bg-[#00d4ff08]">
                <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
                <span className="text-xs text-[#00d4ff] tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                  Elo Rating: {userData.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <h2 className="text-xl font-bold text-[#e8edf2] mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Lifetime Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Matches", value: userData.matchesPlayed, color: "text-[#e8edf2]" },
            { label: "Wins", value: userData.wins, color: "text-[#00ff88]" },
            { label: "Losses", value: userData.losses, color: "text-[#ff4757]" },
            {
              label: "Win Rate",
              value: userData.matchesPlayed > 0
                ? `${Math.round((userData.wins / userData.matchesPlayed) * 100)}%`
                : "0%",
              color: "text-[#00d4ff]"
            },
          ].map((stat, i) => (
            <div key={i} className="card-arena rounded-xl p-6 text-center">
              <div className={`text-3xl font-bold mb-1 ${stat.color}`} style={{ fontFamily: "var(--font-display)" }}>
                {stat.value}
              </div>
              <div className="text-xs text-[#6b8299] uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Match History Placeholder */}
        <h2 className="text-xl font-bold text-[#e8edf2] mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Recent Battles
        </h2>
        <div className="card-arena rounded-xl overflow-hidden">
          <div className="p-8 text-center text-[#6b8299]">
            <p>No battles fought yet. Head to the arena to make your mark!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
