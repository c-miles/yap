import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/react";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

// hex copies of the index.css tokens: clerk sets its own --accent inside its
// components, so var(--accent) there would point at itself
const colors = {
  bg: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  accent: "#2dd4bf",
  accentHover: "#14b8a6",
  accentFg: "#0f172a",
  danger: "#f87171",
};

// the extra &s outrank clerk's own focus styles
const keyboardFocus = {
  "&&&:focus-visible": { boxShadow: `0 0 0 2px ${colors.surface}, 0 0 0 4px ${colors.accent}` },
};

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: colors.accent,
    colorPrimaryForeground: colors.accentFg,
    colorBackground: colors.surface,
    colorForeground: colors.text,
    colorMutedForeground: colors.textSecondary,
    colorNeutral: colors.text,
    colorInput: colors.bg,
    colorInputForeground: colors.text,
    colorRing: colors.accent,
    colorDanger: colors.danger,
    colorModalBackdrop: "rgba(2, 6, 23, 0.6)",
    borderRadius: "0.5rem",
  },
  elements: {
    // auto margins center the modal but let a too-tall one scroll from the top.
    // && so it beats clerk's own phone-width margin
    modalContent: { "&&": { margin: "auto" } },
    headerTitle: { fontFamily: '"Bricolage Grotesque Variable", system-ui, sans-serif' },
    formButtonPrimary: { "&:hover": { backgroundColor: colors.accentHover }, ...keyboardFocus },
    socialButtonsIconButton: keyboardFocus,
    modalCloseButton: keyboardFocus,
    footerActionLink: { "&:hover": { color: colors.accent } },
    footer: { "& a:focus-visible": { outline: `2px solid ${colors.accent}`, outlineOffset: "2px", borderRadius: "2px" } },
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
