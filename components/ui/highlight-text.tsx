import React from "react";

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

/**
 * Component to highlight matching text based on search query
 * @param text - The full text to display
 * @param searchQuery - The search term to highlight
 * @param className - Optional CSS class for the container
 */
export function HighlightText({
  text,
  searchQuery,
  className = "",
}: HighlightTextProps) {
  // If no search query or text, return original text
  if (!searchQuery || !text || searchQuery.trim() === "") {
    return <span className={className}>{text}</span>;
  }

  const trimmedQuery = searchQuery.trim();

  // Create a case-insensitive regex to find all matches
  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi");

  // Split the text by matches
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search query (case-insensitive)
        const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

        return isMatch ? (
          <mark
            key={index}
            className='bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 font-semibold px-0.5 rounded'
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </span>
  );
}

/**
 * Escape special regex characters in the search query
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
