import { render } from "@react-email/components";
import type { ReactElement } from "react";

/** The HTML to send, with the inline styles and table layout mail clients need. */
export function renderEmailHtml(email: ReactElement, options: { pretty?: boolean } = {}) {
  return render(email, { pretty: options.pretty ?? false });
}

/** The plain-text part of the same email, for clients that do not show HTML. */
export function renderEmailText(email: ReactElement) {
  return render(email, { plainText: true });
}
