import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import femaleAvatar from "../images/female.png";
import maleAvatar from "../images/male.png";
import robotAvatar from "../images/robot.png";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, userData, refreshUserData } = useAuth();
  const [username, setUsername] = useState("");
  
  const avatars = [femaleAvatar, maleAvatar, robotAvatar];
  const [avatarIndex, setAvatarIndex] = useState(0);
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userData) {
      setUsername(userData.username);
      // Try to find the user's current avatar in the list, otherwise default to 0
      const currentAvatarIndex = avatars.findIndex(a => a === userData.photoURL);
      if (currentAvatarIndex !== -1) {
        setAvatarIndex(currentAvatarIndex);
      }
    }
  }, [userData, isOpen]);

  if (!isOpen || !user || !userData) return null;

  const currentAvatar = avatars[avatarIndex];

  const handleNextAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % avatars.length);
  };

  const handlePrevAvatar = () => {
    setAvatarIndex((prev) => (prev - 1 + avatars.length) % avatars.length);
  };

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
      const response = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          username,
          photoURL: currentAvatar, // Save the path
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update profile.");
        setIsSubmitting(false);
        return;
      }

      // Update successful!
      await refreshUserData();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to update profile. Please check if the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080c10]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0d1420] border border-[#00ff8844] rounded-xl p-8 glow-green animate-in fade-in zoom-in duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b8299] hover:text-[#e8edf2]"
        >
          ✕
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#e8edf2]" style={{ fontFamily: "var(--font-display)" }}>
            Edit Profile
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button 
                type="button" 
                onClick={handlePrevAvatar}
                className="text-[#6b8299] hover:text-[#00ff88] transition-colors p-2 text-2xl font-bold"
              >
                &lt;
              </button>
              <img 
                src={currentAvatar} 
                alt="Avatar Preview" 
                className="w-32 h-32 rounded-xl border-2 border-[#00ff8844] object-cover bg-[#080c10]"
              />
              <button 
                type="button" 
                onClick={handleNextAvatar}
                className="text-[#6b8299] hover:text-[#00ff88] transition-colors p-2 text-2xl font-bold"
              >
                &gt;
              </button>
            </div>
            <div className="text-[#6b8299] text-xs uppercase tracking-wider">
              Choose Avatar ({avatarIndex + 1} / {avatars.length})
            </div>
          </div>

          {/* Username Section */}
          <div>
            <label className="block text-[#6b8299] text-xs uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="e.g. CodeNinja99"
              maxLength={20}
              className="w-full bg-[#080c10] border border-[#1a2535] rounded-lg px-4 py-3 text-[#e8edf2] focus:outline-none focus:border-[#00ff88] transition-all duration-200"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {error && <p className="text-[#ff4757] text-xs mt-2">{error}</p>}
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-3 rounded-lg bg-[#00ff88] hover:bg-[#00cc6a] text-[#080c10] font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50 mt-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
