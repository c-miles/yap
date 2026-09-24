import React from "react";
import { Link } from "react-router-dom";

const LINK_CLASS = "focus-ring hover:text-text transition-base";

const Footer: React.FC<{ className?: string }> = ({ className = "" }) => (
  <footer className={`flex justify-center gap-6 py-6 text-sm text-text-muted ${className}`}>
    <Link to="/privacy" className={LINK_CLASS}>Privacy</Link>
    <Link to="/terms" className={LINK_CLASS}>Terms</Link>
  </footer>
);

export default Footer;
