import { useEffect } from "react";

// matches index.html's <title>, which the server rewrites on /room/ links
const BASE_TITLE = "yap · Drop-in video rooms for your group";

export default function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · yap` : BASE_TITLE;
  }, [title]);
}
