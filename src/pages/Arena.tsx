import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

function Arena() {
  const { user, userData } = useAuth();
  const { code } = useParams();
  const navigate = useNavigate();

  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (player1Ready && player2Ready) {
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  }, [player1Ready, player2Ready]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-[#080c10] text-[#e8edf2] flex flex-col font-sans">
      <header className="p-6 border-b border-[#1a2535] flex items-center justify-between">
        <div className="text-[#00ff88] font-bold text-xl tracking-widest uppercase flicker">
          DSA<span className="text-glow-green" style={{ textShadow: "0 0 10px #00ff88" }}>PvP</span> Arena
        </div>
        <div className="text-[#6b8299]">
          Room Code: <span className="text-[#e8edf2] font-mono">{code || "WAITING"}</span>
        </div>
        <button onClick={() => navigate("/")} className="px-4 py-2 border border-[#1a2535] rounded text-[#6b8299] hover:text-[#e8edf2] hover:border-[#ff475744] transition-all">
          Leave Arena
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 relative">
        
        {countdown !== null && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080c10]/80 backdrop-blur-sm">
            <h2 className="text-4xl text-[#00ff88] mb-4">Match Starting In</h2>
            <div className="text-9xl font-bold" style={{ color: "#00ff88", textShadow: "0 0 20px #00ff88" }}>
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-0">
          
          {/* Player 1 (Left) */}
          <div className={`p-8 border-2 rounded-xl flex flex-col items-center transition-all duration-300 ${player1Ready ? 'border-[#00ff88] bg-[#00ff88]/5' : 'border-[#1a2535] bg-[#0d1520]'}`}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a2535] mb-6 bg-[#1a2535]">
              <img src={userData?.photoURL || user?.photoURL || "/src/images/robot.png"} alt="Player 1" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{userData?.username || user?.displayName || "Player 1"}</h2>
            <p className="text-[#6b8299] mb-8">Rating: 1200</p>
            
            <button 
              onClick={() => setPlayer1Ready(!player1Ready)}
              className={`px-8 py-3 rounded font-bold text-lg transition-all w-full ${player1Ready ? 'bg-[#00ff88] text-[#080c10] shadow-[0_0_15px_rgba(0,255,136,0.4)]' : 'bg-transparent border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10'}`}
            >
              {player1Ready ? "Ready" : "Click to Ready"}
            </button>
          </div>

          {/* Player 2 (Right) */}
          <div className={`p-8 border-2 rounded-xl flex flex-col items-center transition-all duration-300 ${player2Ready ? 'border-[#00ff88] bg-[#00ff88]/5' : 'border-[#1a2535] bg-[#0d1520]'}`}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a2535] mb-6 bg-[#1a2535]">
              <img src="/src/images/robot.png" alt="Player 2" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Opponent</h2>
            <p className="text-[#6b8299] mb-8">Rating: 1200</p>
            
            <button 
              onClick={() => setPlayer2Ready(!player2Ready)}
              className={`px-8 py-3 rounded font-bold text-lg transition-all w-full ${player2Ready ? 'bg-[#00ff88] text-[#080c10] shadow-[0_0_15px_rgba(0,255,136,0.4)]' : 'bg-transparent border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10'}`}
            >
              {player2Ready ? "Ready" : "Click to Ready"}
            </button>
          </div>

        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#080c10] border-2 border-[#1a2535] rounded-full flex items-center justify-center font-black text-2xl italic z-0 hidden md:flex text-[#6b8299]">
          VS
        </div>
      </main>
    </div>
  );
}

export default Arena;