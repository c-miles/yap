import { useEffect } from "react";

// matches index.html's <title>, which the server rewrites on /room/ links
const BASE_TITLE = "Yap · Drop-in video rooms for your group";

export default function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Yap` : BASE_TITLE;
  }, [title]);
}
