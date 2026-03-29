import { useState, useRef, useEffect } from 'react';

export default function ExpandableText({ text, maxLines = 5, children }) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef(null);
  const measuredRef = useRef(false);

  useEffect(() => {
    if (contentRef.current && !measuredRef.current) {
      const el = contentRef.current;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const maxHeight = lineHeight * maxLines;
      if (el.scrollHeight > maxHeight + 4) {
        setNeedsTruncation(true);
      }
      measuredRef.current = true;
    }
  }, [text, maxLines]);

  if (!needsTruncation) {
    return (
      <div ref={contentRef}>
        {children || <span className="whitespace-pre-wrap">{text}</span>}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={contentRef}
        style={expanded ? {} : {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {children || <span className="whitespace-pre-wrap">{text}</span>}
      </div>
      <button
        data-testid="expand-toggle"
        onClick={() => setExpanded(!expanded)}
        className="text-[#EF4444] hover:text-[#DC2626] text-[13px] font-semibold mt-1 inline-block"
      >
        {expanded ? 'Less' : 'More...'}
      </button>
    </div>
  );
}
