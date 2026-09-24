import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { ChevronDown } from "lucide-react";
import { Avatar, Icon, Wordmark } from "./atoms";

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

  const handleSignOut = () => {
    // the redirect comes from afterSignOutUrl in ClerkProviderWithNavigate
    signOut();
  };

  return (
    <nav className="sticky top-0 z-sticky h-16 bg-glass backdrop-blur-md border-b border-glass-border">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="focus-ring rounded">
          <Wordmark />
        </Link>
        
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="focus-ring flex items-center gap-2 p-2 rounded-lg hover:bg-glass-hover transition-base"
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
              <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl overflow-hidden">
                <button
                  onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  className="focus-ring w-full px-4 py-3 text-left text-text hover:bg-glass-hover transition-base"
                >
                  Profile
                </button>
                <div className="border-t border-glass-border" />
                <button
                  onClick={handleSignOut}
                  className="focus-ring w-full px-4 py-3 text-left text-text hover:bg-glass-hover transition-base"
                >
                  Sign out
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
