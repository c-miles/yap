import React from "react";
import { Heading, Text } from "./atoms";
import useDocumentTitle from "../hooks/useDocumentTitle";

const CONTACT_EMAIL = "contact@anomaly-labs.com";

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <Heading level={2} size="md">{title}</Heading>
    {children}
  </section>
);

export const LegalList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="list-disc pl-5 space-y-2 text-text-secondary">{children}</ul>
);

export const ContactLink: React.FC = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="focus-ring text-accent hover:underline">
    {CONTACT_EMAIL}
  </a>
);

const LegalPage: React.FC<{ title: string; updated: string; children: React.ReactNode }> = ({
  title,
  updated,
  children,
}) => {
  useDocumentTitle(title);
  return (
    <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-2">
        <Heading level={1}>{title}</Heading>
        <Text variant="muted">Last updated {updated}</Text>
      </header>
      {children}
    </main>
  );
};

export default LegalPage;
