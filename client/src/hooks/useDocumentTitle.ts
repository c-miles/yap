import { useEffect } from "react";

const baseTitle = document.title;

export default function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Yap` : baseTitle;
  }, [title]);
}
