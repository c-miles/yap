// Copies text, returning whether it truly succeeded. Async Clipboard API in secure contexts, execCommand fallback for HTTP/LAN and older browsers.
//
// Deliberately `if (navigator.clipboard)`, not `navigator.clipboard?.writeText`: in an insecure context clipboard is undefined and `?.` returns undefined without throwing, silently skipping the fallback.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
