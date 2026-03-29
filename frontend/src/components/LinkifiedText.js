import { useState, Fragment } from 'react';
import ExternalLinkModal from './ExternalLinkModal';
import { ExternalLink } from 'lucide-react';

// Regex to match URLs starting with https://, http://, or www.
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+/gi;

export default function LinkifiedText({ text, className = '' }) {
  const [externalLink, setExternalLink] = useState(null);

  if (!text) return null;

  const handleLinkClick = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Normalize URL - add https:// if starts with www.
    let normalizedUrl = url;
    if (url.toLowerCase().startsWith('www.')) {
      normalizedUrl = 'https://' + url;
    }
    
    setExternalLink({
      url: normalizedUrl,
      isHttp: normalizedUrl.toLowerCase().startsWith('http://') && !normalizedUrl.toLowerCase().startsWith('https://')
    });
  };

  // Split text and find URLs
  const parts = [];
  let lastIndex = 0;
  let match;
  
  const regex = new RegExp(URL_REGEX);
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }
    
    // Add the URL
    parts.push({
      type: 'link',
      content: match[0],
      isHttp: match[0].toLowerCase().startsWith('http://') && !match[0].toLowerCase().startsWith('https://')
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return (
    <>
      <span className={className}>
        {parts.map((part, index) => (
          <Fragment key={index}>
            {part.type === 'text' ? (
              part.content
            ) : (
              <button
                onClick={(e) => handleLinkClick(e, part.content)}
                className={`inline-flex items-center gap-0.5 ${
                  part.isHttp 
                    ? 'text-[#EF4444] hover:text-[#DC2626]' 
                    : 'text-[#3B82F6] hover:text-[#2563EB]'
                } hover:underline break-all`}
                title={part.isHttp ? '⚠️ Unsecured HTTP link' : part.content}
              >
                {part.content}
                <ExternalLink className="w-3 h-3 shrink-0 inline" />
              </button>
            )}
          </Fragment>
        ))}
      </span>

      {externalLink && (
        <ExternalLinkModal
          open={true}
          onClose={() => setExternalLink(null)}
          url={externalLink.url}
          isHttp={externalLink.isHttp}
        />
      )}
    </>
  );
}
