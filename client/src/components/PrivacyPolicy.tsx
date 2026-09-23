import React from "react";
import { Heading, Text } from "./atoms";

const CONTACT_EMAIL = "contact@anomaly-labs.com";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <Heading level={2} size="md">{title}</Heading>
    {children}
  </section>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="list-disc pl-5 space-y-2 text-text-secondary">{children}</ul>
);

const ContactLink: React.FC = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="focus-ring text-accent hover:underline">
    {CONTACT_EMAIL}
  </a>
);

const PrivacyPolicy: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
    <header className="space-y-2">
      <Heading level={1}>Privacy policy</Heading>
      <Text variant="muted">Last updated September 23, 2026</Text>
    </header>

    <Text variant="secondary">
      Yap is a video chat app made by Anomaly Labs LLC. This page explains what Yap keeps
      about you, and what it doesn't.
    </Text>

    <Section title="What we collect">
      <List>
        <li>
          Your account details: name, email address, and profile picture. These come from Clerk,
          our sign-in provider, or from Google or GitHub if you sign in with one of them.
        </li>
        <li>The username you choose.</li>
        <li>
          Chat messages you send in a room. They're saved with the room and your username so
          everyone in the room can see the conversation.
        </li>
        <li>Room names, and who is in a room while a call is happening.</li>
      </List>
    </Section>

    <Section title="What we don't collect">
      <List>
        <li>
          Calls are never recorded. Video and audio go directly between the people in a call,
          encrypted. When a direct connection isn't possible they pass through Cloudflare's relay
          servers, still encrypted, and aren't stored there.
        </li>
        <li>No ads, no analytics or tracking, and we never sell your data.</li>
        <li>The only cookies are the ones that keep you signed in.</li>
      </List>
    </Section>

    <Section title="Who helps run Yap">
      <Text variant="secondary">These services only get what they need to do their job:</Text>
      <List>
        <li>Clerk handles sign-in.</li>
        <li>Render hosts the app.</li>
        <li>Our database host stores accounts, rooms, and chat messages.</li>
        <li>Cloudflare runs our DNS and the call relay.</li>
        <li>Google or GitHub, if you choose to sign in with them.</li>
      </List>
    </Section>

    <Section title="Keeping and deleting your data">
      <Text variant="secondary">
        We keep your account and chat messages until you ask us to delete them. Email{" "}
        <ContactLink /> and we'll delete your account and messages.
      </Text>
    </Section>

    <Section title="Children">
      <Text variant="secondary">Yap isn't meant for children under 13.</Text>
    </Section>

    <Section title="Changes">
      <Text variant="secondary">
        If this policy changes, we'll update this page and the date at the top.
      </Text>
    </Section>

    <Section title="Contact">
      <Text variant="secondary">
        Questions about your privacy? Email <ContactLink />.
      </Text>
    </Section>
  </main>
);

export default PrivacyPolicy;
