import React from "react";
import { Link } from "react-router-dom";
import { Text } from "./atoms";
import LegalPage, { ContactLink, LegalList, LegalSection } from "./LegalPage";

const TermsOfService: React.FC = () => (
  <LegalPage title="Terms of service" updated="September 23, 2026">
    <Text variant="secondary">
      These terms cover your use of Yap, a video chat app made by Anomaly Labs LLC. By using Yap
      you agree to them. Our{" "}
      <Link to="/privacy" className="focus-ring text-accent hover:underline">
        privacy policy
      </Link>{" "}
      explains what we do with your data.
    </Text>

    <LegalSection title="Using Yap">
      <Text variant="secondary">
        You need to be at least 13. You're responsible for your account and what happens under
        it, so keep your login to yourself.
      </Text>
    </LegalSection>

    <LegalSection title="Be decent">
      <LegalList>
        <li>Don't use Yap for anything illegal.</li>
        <li>Don't harass, threaten, or abuse people.</li>
        <li>Don't spam, or try to break, overload, or get around Yap's security.</li>
        <li>Don't record or share a call without the consent of the people in it.</li>
      </LegalList>
    </LegalSection>

    <LegalSection title="Your messages">
      <Text variant="secondary">
        Chat messages you send are yours. You let us store them and show them to the people in
        the room, which is what Yap needs to do to work.
      </Text>
    </LegalSection>

    <LegalSection title="Yap is provided as-is">
      <Text variant="secondary">
        We work to keep Yap running and secure, but we can't promise it will always be available,
        free of bugs, or that every call will connect. To the extent the law allows, Anomaly Labs
        isn't liable for any indirect, incidental, or consequential damages from using Yap.
      </Text>
    </LegalSection>

    <LegalSection title="Ending things">
      <Text variant="secondary">
        You can stop using Yap anytime, and email <ContactLink /> to have your account deleted.
        We may suspend or remove accounts that break these terms.
      </Text>
    </LegalSection>

    <LegalSection title="Changes">
      <Text variant="secondary">
        We may update these terms. If we do, we'll change the date at the top, and using Yap after
        that means you accept the new version.
      </Text>
    </LegalSection>

    <LegalSection title="Governing law">
      <Text variant="secondary">These terms are governed by the laws of the State of Washington, USA.</Text>
    </LegalSection>

    <LegalSection title="Contact">
      <Text variant="secondary">
        Questions about these terms? Email <ContactLink />.
      </Text>
    </LegalSection>
  </LegalPage>
);

export default TermsOfService;
