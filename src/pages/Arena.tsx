import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { ArenaCodingWorkspace } from "../components/ArenaCodingWorkspace";
import { Swords, Copy, Check, Users, AlertTriangle } from "lucide-react";
import { getSocket, connectSocket, disconnectSocket, type ArenaPlayer, type ArenaState } from "../lib/socket";

function Arena() {
  const { user, userData } = useAuth();
  const { code } = useParams();
  const navigate = useNavigate();

  const roomCode = useMemo(() => (code || "SOLO").toUpperCase(), [code]);
  const isSolo = roomCode === "SOLO";

  const [connected, setConnected] = useState(false);
  const [arenaState, setArenaState] = useState<ArenaState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchStarted, setMatchStarted] = useState(false);
  const [activeQuestionSlug, setActiveQuestionSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [opponentProgress, setOpponentProgress] = useState<{ passed: number; total: number } | null>(null);

  const socket = getSocket();

  // Socket setup & room lifecycle
  useEffect(() => {
    if (isSolo) {
      setConnected(true);
      return;
    }

    const s = connectSocket();

    const onConnect = () => {
      setConnected(true);
      setErrorMessage(null);
      s.emit("join-arena", {
        roomId: roomCode,
        user: {
          uid: user?.uid || null,
          username: userData?.username || user?.displayName || `Player_${s.id?.slice(0, 4) || "Guest"}`,
          photoURL: userData?.photoURL || user?.photoURL || "/src/images/robot.png",
          rating: userData?.rating || 1200,
        },
      });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onArenaState = (state: ArenaState) => {
      setArenaState(state);
      if (state.status === "in-progress" && state.questionSlug) {
        setActiveQuestionSlug(state.questionSlug);
        setMatchStarted(true);
      }
    };

    const onCountdownStart = ({ countdown: count, questionSlug }: { countdown: number; questionSlug: string }) => {
      setActiveQuestionSlug(questionSlug);
      setCountdown(count);
    };

    const onCountdownTick = ({ countdown: count }: { countdown: number }) => {
      setCountdown(count);
      if (count === 0) {
        setTimeout(() => {
          setCountdown(null);
          setMatchStarted(true);
        }, 500);
      }
    };

    const onMatchStarted = ({ questionSlug }: { questionSlug: string }) => {
      setActiveQuestionSlug(questionSlug);
      setCountdown(null);
      setMatchStarted(true);
    };

    const onOpponentProgress = (data: { passed: number; total: number }) => {
      setOpponentProgress(data);
    };

    const onArenaError = (err: { message: string }) => {
      setErrorMessage(err.message);
    };

    const onOpponentLeft = ({ username }: { username: string }) => {
      setErrorMessage(`${username} has left the arena room.`);
      setOpponentProgress(null);
    };

    const onRematchStarted = () => {
      setMatchStarted(false);
      setCountdown(null);
      setOpponentProgress(null);
    };

    if (s.connected) {
      onConnect();
    } else {
      s.on("connect", onConnect);
    }

    s.on("disconnect", onDisconnect);
    s.on("arena-state", onArenaState);
    s.on("countdown-start", onCountdownStart);
    s.on("countdown-tick", onCountdownTick);
    s.on("match-started", onMatchStarted);
    s.on("opponent-progress", onOpponentProgress);
    s.on("arena-error", onArenaError);
    s.on("opponent-left", onOpponentLeft);
    s.on("rematch-started", onRematchStarted);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("arena-state", onArenaState);
      s.off("countdown-start", onCountdownStart);
      s.off("countdown-tick", onCountdownTick);
      s.off("match-started", onMatchStarted);
      s.off("opponent-progress", onOpponentProgress);
      s.off("arena-error", onArenaError);
      s.off("opponent-left", onOpponentLeft);
      s.off("rematch-started", onRematchStarted);

      s.emit("leave-arena", { roomId: roomCode });
    };
  }, [roomCode, isSolo, user?.uid, userData?.username]);

  // Identify players from room state
  const myPlayer: ArenaPlayer | undefined = arenaState?.players.find(
    (p) => p.socketId === socket.id || (user?.uid && p.uid === user.uid)
  );

  const opponentPlayer: ArenaPlayer | undefined = arenaState?.players.find(
    (p) => p.socketId !== socket.id && (!user?.uid || p.uid !== user.uid)
  );

  const handleToggleReady = () => {
    if (isSolo) {
      setMatchStarted(true);
      return;
    }
    socket.emit("toggle-ready", { roomId: roomCode });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveArena = () => {
    disconnectSocket();
    navigate("/");
  };

  if (matchStarted) {
    return (
      <div className="h-screen w-screen bg-[#080c10] text-[#e8edf2] flex flex-col font-sans overflow-hidden">
        {/* Cool Competitive Coding Header */}
        <header className="px-6 py-2.5 border-b border-[#1a2535] flex items-center justify-between bg-[#0a0f16]/95 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <div className="text-[#00ff88] font-bold text-lg tracking-widest uppercase flex items-center gap-2">
              <Swords size={20} className="text-[#00ff88]" />
              DSA<span className="text-glow-green" style={{ textShadow: "0 0 10px #00ff88" }}>PvP</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff4757] text-[11px] font-mono font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4757] animate-ping" />
              Live 1v1 Battle
            </div>

            <div className="hidden md:flex items-center gap-2 bg-[#0d1520] border border-[#1a2535] rounded-lg px-2.5 py-1 text-xs font-mono">
              <span className="text-[#6b8299]">ROOM:</span>
              <span className="text-[#e8edf2] font-bold">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="text-[#6b8299] hover:text-[#00ff88] transition-colors ml-1"
              >
                {copied ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Duelists info in header */}
          <div className="hidden lg:flex items-center gap-3 bg-[#0d1520]/80 px-4 py-1 rounded-full border border-[#1a2535] text-xs font-mono">
            <span className="text-[#00ff88] font-bold">{myPlayer?.username || "You"}</span>
            <span className="text-[#6b8299] font-black italic">VS</span>
            <span className="text-[#00d4ff] font-bold">{opponentPlayer ? opponentPlayer.username : "Waiting Opponent..."}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveArena}
              className="px-4 py-1.5 border border-[#ff475744] bg-[#ff475711] text-[#ff4757] rounded-lg text-xs font-bold hover:bg-[#ff475722] hover:border-[#ff4757] transition-all font-mono"
            >
              Exit Arena
            </button>
          </div>
        </header>

        <ArenaCodingWorkspace
          roomId={roomCode}
          initialQuestionSlug={activeQuestionSlug || undefined}
          opponent={opponentPlayer}
          opponentProgress={opponentProgress}
          onRematch={() => socket.emit("rematch-request", { roomId: roomCode })}
          onExit={handleLeaveArena}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c10] text-[#e8edf2] flex flex-col font-sans">
      <header className="p-6 border-b border-[#1a2535] flex items-center justify-between">
        <div className="text-[#00ff88] font-bold text-xl tracking-widest uppercase flicker flex items-center gap-2">
          <Swords size={22} className="text-[#00ff88]" />
          DSA<span className="text-glow-green" style={{ textShadow: "0 0 10px #00ff88" }}>PvP</span> Arena
        </div>

        <div className="flex items-center gap-2 bg-[#0d1520] border border-[#1a2535] rounded-full px-3 py-1 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88]' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-[#6b8299]">Room:</span>
          <span className="text-[#e8edf2] font-bold">{roomCode}</span>
          <button
            onClick={handleCopyCode}
            title="Copy Room Code"
            className="text-[#6b8299] hover:text-[#00ff88] transition-colors ml-1"
          >
            {copied ? <Check size={14} className="text-[#00ff88]" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveArena}
            className="px-4 py-2 border border-[#1a2535] rounded text-[#6b8299] hover:text-[#e8edf2] hover:border-[#ff475744] transition-all font-mono text-sm"
          >
            Leave Arena
          </button>
        </div>
      </header>


      {/* Error / Notification Banner */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs hover:text-white underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center justify-center p-6 relative">
        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#080c10]/95 backdrop-blur-md">
            <h2 className="text-3xl text-[#00ff88] mb-3 font-mono font-bold tracking-widest uppercase">
              Match Starting In
            </h2>
            <div
              className="text-9xl font-bold font-mono transition-transform duration-300 scale-110"
              style={{ color: "#00ff88", textShadow: "0 0 30px #00ff88" }}
            >
              {countdown > 0 ? countdown : "FIGHT!"}
            </div>
            <p className="mt-4 text-[#6b8299] font-mono text-sm">Synchronizing algorithm challenge...</p>
          </div>
        )}

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-0">
          {/* Player 1 (You) */}
          <div
            className={`p-8 border-2 rounded-xl flex flex-col items-center transition-all duration-300 ${
              myPlayer?.isReady
                ? "border-[#00ff88] bg-[#00ff88]/5 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                : "border-[#1a2535] bg-[#0d1520]"
            }`}
          >
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a2535] bg-[#1a2535]">
                <img
                  src={myPlayer?.photoURL || userData?.photoURL || user?.photoURL || "/src/images/robot.png"}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              {myPlayer?.isReady && (
                <div className="absolute -bottom-1 -right-1 bg-[#00ff88] text-[#080c10] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase shadow-lg">
                  Ready
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">
                {myPlayer?.username || userData?.username || user?.displayName || "You"}
              </h2>
              <span className="text-xs bg-[#00ff88]/20 text-[#00ff88] px-2 py-0.5 rounded font-mono font-bold">YOU</span>
            </div>
            <p className="text-[#6b8299] mb-8 font-mono">Rating: {myPlayer?.rating || userData?.rating || 1200}</p>

            <button
              onClick={handleToggleReady}
              className={`px-8 py-3.5 rounded font-bold text-base transition-all w-full flex items-center justify-center gap-2 ${
                myPlayer?.isReady
                  ? "bg-[#00ff88] text-[#080c10] shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:brightness-110"
                  : "bg-transparent border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10"
              }`}
            >
              {myPlayer?.isReady ? (
                <>
                  <Check size={18} /> Ready! Click to Unready
                </>
              ) : (
                "Click to Ready Up"
              )}
            </button>
          </div>

          {/* Player 2 (Opponent) */}
          {opponentPlayer ? (
            <div
              className={`p-8 border-2 rounded-xl flex flex-col items-center transition-all duration-300 ${
                opponentPlayer.isReady
                  ? "border-[#00ff88] bg-[#00ff88]/5 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                  : "border-[#1a2535] bg-[#0d1520]"
              }`}
            >
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a2535] bg-[#1a2535]">
                  <img
                    src={opponentPlayer.photoURL || "/src/images/robot.png"}
                    alt={opponentPlayer.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {opponentPlayer.isReady && (
                  <div className="absolute -bottom-1 -right-1 bg-[#00ff88] text-[#080c10] text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase shadow-lg">
                    Ready
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{opponentPlayer.username}</h2>
                <span className="text-xs bg-[#00d4ff]/20 text-[#00d4ff] px-2 py-0.5 rounded font-mono font-bold">
                  OPPONENT
                </span>
              </div>
              <p className="text-[#6b8299] mb-8 font-mono">Rating: {opponentPlayer.rating}</p>

              <div
                className={`px-8 py-3.5 rounded font-bold text-base w-full text-center font-mono ${
                  opponentPlayer.isReady
                    ? "bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88]"
                    : "bg-[#1a2535] border border-[#2a384c] text-[#6b8299]"
                }`}
              >
                {opponentPlayer.isReady ? "Opponent is Ready ✓" : "Waiting for opponent to ready..."}
              </div>
            </div>
          ) : (
            /* Waiting for Opponent to Join */
            <div className="p-8 border-2 border-dashed border-[#1a2535] rounded-xl flex flex-col items-center justify-center bg-[#0d1520]/50 text-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#2a384c] flex items-center justify-center mb-6 text-[#2a384c] animate-pulse">
                <Users size={36} />
              </div>

              <h2 className="text-xl font-bold text-[#e8edf2] mb-2 font-mono">Awaiting Challenger...</h2>
              <p className="text-[#6b8299] text-sm max-w-xs mb-6">
                Share your arena code or invite link with an opponent to start a real-time DSA duel.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 py-2.5 px-4 bg-[#1a2535] hover:bg-[#2a384c] border border-[#2a384c] hover:border-[#00ff88]/50 text-xs font-mono font-bold text-[#00ff88] rounded transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  Copy Code: {roomCode}
                </button>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex-1 py-2.5 px-4 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/40 text-xs font-mono font-bold text-[#00d4ff] rounded transition-all flex items-center justify-center gap-2"
                >
                  Copy Invite Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VS Badge */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#080c10] border-2 border-[#1a2535] rounded-full flex items-center justify-center font-black text-2xl italic z-10 hidden md:flex text-[#6b8299]">
          VS
        </div>
      </main>
    </div>
  );
}

export default Arena;