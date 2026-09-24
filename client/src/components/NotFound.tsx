import React from "react";
import { Link } from "react-router-dom";
import { Heading, Text, buttonClassName } from "./atoms";
import useDocumentTitle from "../hooks/useDocumentTitle";

const NotFound: React.FC = () => {
  useDocumentTitle("Page not found");
  return (
    <main className="flex flex-col items-center justify-center gap-3 min-h-[calc(100vh-64px)] px-6 text-center">
      <Heading level={1}>Nothing here</Heading>
      <Text variant="secondary">This page doesn't exist. Check the link, or head back.</Text>
      <Link to="/" className={buttonClassName("primary", "md", "mt-4")}>
        Go home
      </Link>
    </main>
  );
};

export default NotFound;
