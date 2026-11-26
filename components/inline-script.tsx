// Runs during HTML parsing on full page loads. On the client the type becomes
// text/plain so React doesn't warn about rendering <script> tags.
// Pattern from Next.js docs: guides/preventing-flash-before-hydration.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
