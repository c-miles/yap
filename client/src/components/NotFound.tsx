import React from "react";
import { Link } from "react-router-dom";
import { buttonClassName } from "./atoms";
import { StatePanel } from "./molecules";
import useDocumentTitle from "../hooks/useDocumentTitle";

const NotFound: React.FC = () => {
  useDocumentTitle("Page not found");
  return (
    <StatePanel className="m-auto" title="Nothing here" description="This page doesn't exist. Check the link, or head back.">
      <Link to="/" className={buttonClassName()}>
        Go home
      </Link>
    </StatePanel>
  );
};

export default NotFound;
