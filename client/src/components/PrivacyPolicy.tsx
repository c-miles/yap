import React from "react";
import { Text } from "./atoms";
import LegalPage, { ContactLink, LegalList, LegalSection } from "./LegalPage";

const PrivacyPolicy: React.FC = () => (
  <LegalPage title="Privacy policy" updated="September 24, 2026">
    <Text variant="secondary">
      yap is a video chat app made by Anomaly Labs LLC. This page explains what yap keeps
      about you, and what it doesn't.
    </Text>

    <LegalSection title="What we collect">
      <LegalList>
        <li>
          Your account details: name, email address, and profile picture. These come from Clerk,
          our sign-in provider, or from Google, Microsoft, or GitHub if you sign in with one of them.
        </li>
        <li>The username you choose.</li>
        <li>
          Chat messages you send in a room. They're saved with the room and your username so
          everyone in the room can see the conversation.
        </li>
        <li>Room names, and who is in a room while a call is happening.</li>
      </LegalList>
    </LegalSection>

    <LegalSection title="What we don't collect">
      <LegalList>
        <li>
          Calls are never recorded. Video and audio go directly between the people in a call,
          encrypted. When a direct connection isn't possible they pass through Cloudflare's relay
          servers, still encrypted, and aren't stored there.
        </li>
        <li>No ads, no analytics or tracking, and we never sell your data.</li>
        <li>The only cookies are the ones that keep you signed in.</li>
      </LegalList>
    </LegalSection>

    <LegalSection title="Who helps run yap">
      <Text variant="secondary">These services only get what they need to do their job:</Text>
      <LegalList>
        <li>Clerk handles sign-in.</li>
        <li>Render hosts the app.</li>
        <li>Our database host stores accounts, rooms, and chat messages.</li>
        <li>Cloudflare runs our DNS and the call relay.</li>
        <li>Google, Microsoft, or GitHub, if you choose to sign in with them.</li>
      </LegalList>
    </LegalSection>

    <LegalSection title="Keeping and deleting your data">
      <Text variant="secondary">
        We keep your account and chat messages until you ask us to delete them. Email{" "}
        <ContactLink /> and we'll delete your account and messages.
      </Text>
    </LegalSection>

    <LegalSection title="Children">
      <Text variant="secondary">yap isn't meant for children under 13.</Text>
    </LegalSection>

    <LegalSection title="Changes">
      <Text variant="secondary">
        If this policy changes, we'll update this page and the date at the top.
      </Text>
    </LegalSection>

    <LegalSection title="Contact">
      <Text variant="secondary">
        Questions about your privacy? Email <ContactLink />.
      </Text>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPolicy;
