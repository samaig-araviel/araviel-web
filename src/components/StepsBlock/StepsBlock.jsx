// StepsBlock has been retired. The system prompt no longer instructs the model
// to emit ```steps fenced blocks; sequential content is rendered as markdown
// numbered lists with full inline formatting (bold titles, sub-bullets, inline
// code, links, fenced code).
//
// This file remains only to keep the import in MessageList.jsx resolvable. The
// component, its else-if branch in renderMarkdown, and the array entries in
// extractCodeBlocksWithNames / parseMessageToSections should be removed in a
// focused follow-up commit. Until then, any legacy ```steps block renders as
// nothing.
export default function StepsBlock() {
  return null;
}
