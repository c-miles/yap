import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/react";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

// literal copies of the index.css tokens: clerk sets its own --accent inside its
// components, so var(--accent) there would point at itself
const colors = {
  surface: "#1e293b",
  border: "#334155",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  accent: "#2dd4bf",
  accentFg: "#0f172a",
  danger: "#f87171",
  glass: "rgba(30, 41, 59, 0.55)",
  glassHover: "rgba(51, 65, 85, 0.75)",
  glassStrong: "rgba(30, 41, 59, 0.85)",
  glassBorder: "rgba(148, 163, 184, 0.25)",
  action: "rgba(248, 250, 252, 0.08)",
  actionHover: "rgba(248, 250, 252, 0.14)",
  actionBorder: "rgba(248, 250, 252, 0.2)",
  field: "rgba(15, 23, 42, 0.7)",
  scrim: "rgba(2, 6, 23, 0.6)",
};

// the extra &s outrank clerk's own button styles
const keyboardFocus = {
  "&&&&:focus-visible": { boxShadow: `0 0 0 2px ${colors.surface}, 0 0 0 4px ${colors.accent}` },
};

export const clerkAppearance: Appearance = {
  options: { logoImageUrl: "/wordmark.png" },
  variables: {
    colorPrimary: colors.accent,
    colorPrimaryForeground: colors.accentFg,
    colorBackground: colors.surface,
    colorForeground: colors.text,
    colorMutedForeground: colors.textSecondary,
    colorNeutral: colors.text,
    colorInput: colors.field,
    colorInputForeground: colors.text,
    colorRing: colors.accent,
    colorDanger: colors.danger,
    colorModalBackdrop: colors.scrim,
    borderRadius: "0.75rem",
  },
  elements: {
    // auto margins center the modal but let a too-tall one scroll from the top.
    // && so it beats clerk's own phone-width margin
    modalContent: { "&&": { margin: "auto" } },
    cardBox: {
      backgroundColor: colors.glassStrong,
      border: `1px solid ${colors.glassBorder}`,
      backdropFilter: "blur(12px)",
      borderRadius: "1rem",
    },
    card: { backgroundColor: "transparent", boxShadow: "none" },
    header: { "&:has(.cl-headerTitle:empty)": { gap: 0 } },
    headerTitle: { fontWeight: 650, fontStretch: "104%", letterSpacing: "-0.01em" },
    formButtonPrimary: {
      backgroundColor: colors.action,
      color: colors.text,
      "&&&&": { border: `1px solid ${colors.actionBorder}`, boxShadow: "none" },
      "&&&&::after": { display: "none" },
      "&:hover": { backgroundColor: colors.actionHover },
      ...keyboardFocus,
    },
    socialButtonsIconButton: {
      backgroundColor: colors.glass,
      "&:hover": { backgroundColor: colors.glassHover },
      ...keyboardFocus,
    },
    modalCloseButton: keyboardFocus,
    footerActionLink: { "&:hover": { color: colors.accent } },
    footer: {
      background: "transparent",
      "& a:focus-visible": { outline: `2px solid ${colors.accent}`, outlineOffset: "2px", borderRadius: "2px" },
    },
    formFieldInput: {
      "&::placeholder": { color: colors.textMuted },
      "&&&:focus": { boxShadow: `0 0 0 2px ${colors.accent}` },
      '&&&[data-feedback="error"]:focus': { boxShadow: `0 0 0 2px ${colors.danger}` },
    },
    dividerLine: { backgroundColor: colors.border },
    // clerk lists providers alphabetically; this shows google first and github last
    socialButtonsIconButton__google: { order: -1 },
    socialButtonsIconButton__github: { order: 1 },
  },
};
