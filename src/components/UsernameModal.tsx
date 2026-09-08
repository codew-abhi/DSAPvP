import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function UsernameModal() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show if logged in but no custom user data, and we've finished loading
  if (loading || !user || userData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    
    // Alphanumeric only
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Only letters, numbers, and underscores allowed.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          username,
          email: user.email,
          photoURL: user.photoURL,
          displayName: user.displayName,
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to register username.");
        setIsSubmitting(false);
        return;
      }

      // Registration successful! Refresh AuthContext to close modal
      await refreshUserData();
    } catch (err: any) {
      console.error(err);
      setError("Failed to register username. Please check if the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080c10]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0d1420] border border-[#00ff8844] rounded-xl p-8 glow-green animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <h2 className="text-2xl font-bold text-[#e8edf2]" style={{ fontFamily: "var(--font-display)" }}>
            Claim Your Username
          </h2>
          <p className="text-sm text-[#6b8299] mt-2">
            This will be your unique handle in the arena. Choose wisely!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="e.g. CodeNinja99"
              maxLength={20}
              className="w-full bg-[#080c10] border border-[#1a2535] rounded-lg px-4 py-3 text-[#e8edf2] placeholder-[#2d3f52] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff8855] transition-all duration-200"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {error && <p className="text-[#ff4757] text-xs mt-2">{error}</p>}
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-3 rounded-lg bg-[#00ff88] hover:bg-[#00cc6a] text-[#080c10] font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isSubmitting ? "Registering..." : "Enter Arena"}
          </button>
        </form>
      </div>
    </div>
  );
}
