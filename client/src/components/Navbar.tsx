import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { ChevronDown } from "lucide-react";
import { Avatar, Icon } from "./atoms";

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
    <nav className="sticky top-0 h-16 bg-surface border-b border-border z-50">
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
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary transition-colors"
            >
              <Avatar src={user.imageUrl} name={user.fullName || "User"} size="sm" />
              <Icon
                icon={ChevronDown}
                size="sm"
                className={`text-text-muted transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left text-text hover:bg-primary transition-colors"
                >
                  Profile
                </button>
                <div className="border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-text hover:bg-danger transition-colors"
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
