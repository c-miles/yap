import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { User, ChevronDown } from "lucide-react";

const Navbar: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Redirect target comes from ClerkProviderWithNavigate's afterSignOutUrl.
    signOut();
  };

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <nav className="sticky top-0 h-16 bg-surface border-b border-slate-700 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-medium text-text">yap</h1>
          <button
            onClick={navigateToDashboard}
            className="text-text-muted hover:text-text transition-colors"
          >
            Lounge
          </button>
        </div>
        
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary transition-colors"
            >
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User size={16} className="text-text" />
                </div>
              )}
              <ChevronDown size={16} className={`text-text-muted transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-slate-700 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left text-text hover:bg-primary transition-colors"
                >
                  Profile
                </button>
                <div className="border-t border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-text hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
