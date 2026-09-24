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
    borderRadius: "0.5rem",
  },
  elements: {
    // auto margins center the modal but let a too-tall one scroll from the top.
    // && so it beats clerk's own phone-width margin
    modalContent: { "&&": { margin: "auto" } },
    headerTitle: { fontFamily: '"Bricolage Grotesque Variable", system-ui, sans-serif' },
    formButtonPrimary: { "&:hover": { backgroundColor: colors.accentHover } },
    footerActionLink: { "&:hover": { color: colors.accent } },
    formFieldInput: { "&::placeholder": { color: colors.textMuted } },
    dividerLine: { backgroundColor: colors.border },
    // clerk lists providers alphabetically; this shows google first and github last
    socialButtonsIconButton__google: { order: -1 },
    socialButtonsIconButton__github: { order: 1 },
  },
};
