import React from "react";
import Linkify from "linkify-react";

const linkOptions = {
  defaultProtocol: "https",
  target: "_blank",
  rel: "noopener noreferrer",
  className: "focus-ring text-accent hover:underline",
};

const MessageText: React.FC<{ text: string }> = ({ text }) => (
  <Linkify as="span" options={linkOptions} className="text-text-secondary break-words">
    {text}
  </Linkify>
);

export default MessageText;
