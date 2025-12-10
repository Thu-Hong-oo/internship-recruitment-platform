import { useRef, useState, useEffect } from "react";

type Props = {
  path: Array<string | number>;
  value: string;
  placeholder?: string;
  editable: boolean;
  onChangeText?: (path: Array<string | number>, value: string) => void;
  onFocusField?: (fieldPath: string) => void;
  onBlurField?: () => void;
  className?: string;
  style?: React.CSSProperties;
  block?: boolean;
};

export default function InlineText({
  path,
  value,
  placeholder,
  editable,
  onChangeText,
  onFocusField,
  onBlurField,
  className,
  style,
  block,
}: Props) {
  const bufferRef = useRef<string>(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const Tag = block ? "div" : "span";
  const isEmpty = !value || value.trim() === "";
  
  // Sync bufferRef and element content when value prop changes (only when not focused)
  useEffect(() => {
    if (!isFocused && elementRef.current) {
      // Use requestAnimationFrame to batch DOM updates and prevent flickering
      requestAnimationFrame(() => {
        if (!elementRef.current) return;
        
        const currentText = elementRef.current.innerText || "";
        const valueText = value || "";
        const placeholderText = placeholder || "";
        
        // Sync bufferRef first
        bufferRef.current = valueText;
        
        // Only update innerText if it doesn't match the expected state
        // This prevents unnecessary DOM updates that cause flickering
        if (valueText) {
          // If we have a value, element should ALWAYS show the value (not placeholder)
          if (currentText !== valueText && currentText !== placeholderText) {
            elementRef.current.innerText = valueText;
          }
        } else if (placeholder) {
          // If no value, element should show placeholder (but only if current text is not a valid value)
          // Don't set placeholder if currentText looks like a valid input (not empty, not placeholder)
          if (currentText !== placeholderText && (!currentText || currentText.trim() === "")) {
            elementRef.current.innerText = placeholder;
          }
        } else {
          // No value and no placeholder, element should be empty
          if (currentText !== "" && currentText !== placeholderText) {
            elementRef.current.innerText = "";
          }
        }
      });
    }
  }, [value, placeholder, isFocused]);
  
  // Merge style: when focused or has value, use normal style; when empty and not focused, use placeholder style
  // Use inline-block for inline elements to maintain layout stability while allowing proper sizing
  const mergedStyle = {
    ...style,
    ...(block ? {
      minHeight: "1.5em",
      display: "block",
      width: "100%",
    } : {
      minHeight: "1em",
      display: "inline-block",
      minWidth: placeholder ? `${placeholder.length * 0.6}em` : "auto",
      verticalAlign: "baseline",
    }),
    ...((isEmpty && !isFocused && placeholder)
      ? { color: style?.color || "#9ca3af", fontStyle: style?.fontStyle || "italic" }
      : { color: style?.color || "#333333" }),
    // Border/padding: only show when editable & focused. Otherwise no border to avoid boxes in export
    ...(editable && isFocused
      ? {
          border: "1px solid #d4d4d4",
          borderRadius: "4px",
          padding: "2px 6px",
          outline: "none",
          transition: "all 0.2s ease-in-out",
        }
      : editable
      ? {
          border: "1px solid transparent",
          borderRadius: "4px",
          padding: "2px 6px",
          transition: "all 0.2s ease-in-out",
        }
      : {
          border: "none",
          padding: 0,
          background: "transparent",
        }),
  };
  
  return (
    <Tag
      ref={(el) => {
        elementRef.current = el;
        if (el && !isFocused) {
          // Set initial content only if element is empty or shows placeholder
          const currentText = el.innerText || "";
          const valueText = value || "";
          const placeholderText = placeholder || "";
          
          // Only set if element is truly empty or showing placeholder
          if (!currentText || currentText === placeholderText) {
            if (valueText) {
              el.innerText = valueText;
              bufferRef.current = valueText;
            } else if (placeholder) {
              el.innerText = placeholder;
              bufferRef.current = "";
            } else {
              el.innerText = "";
              bufferRef.current = "";
            }
          } else if (valueText && currentText !== valueText && currentText !== placeholderText) {
            // If value changed externally and current text is different, update it
            el.innerText = valueText;
            bufferRef.current = valueText;
          }
        }
      }}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      className={className}
      style={mergedStyle}
      data-placeholder={isEmpty && !isFocused ? placeholder : undefined}
      onClick={(e) => {
        // Stop event propagation to prevent parent click handlers
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Stop propagation and ensure this element gets focus
        if (editable) {
          e.stopPropagation();
          const target = e.currentTarget;
          // Focus immediately on mousedown to prevent focus jumping
          if (target !== document.activeElement) {
            target.focus();
            // Set cursor to end if empty, otherwise let browser handle cursor position
            if (isEmpty || !target.innerText || target.innerText === placeholder) {
              setTimeout(() => {
                const selection = window.getSelection();
                if (selection) {
                  const range = document.createRange();
                  range.selectNodeContents(target);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }, 0);
            }
          }
        }
      }}
      onFocus={(e) => {
        setIsFocused(true);
        const element = e.currentTarget;
        const currentText = element.innerText || "";
        // Initialize buffer with current text (not placeholder)
        // If currentText is placeholder, clear it and set buffer to empty
        // Otherwise, use the actual text value
        if (currentText === placeholder) {
          bufferRef.current = "";
          element.innerText = "";
        } else {
          // Use currentText, but also check value prop as fallback
          // This ensures bufferRef has the correct value even if innerText was out of sync
          bufferRef.current = currentText || value || "";
          // If currentText is empty but value prop has a value, use value prop
          if (!currentText && value) {
            element.innerText = value;
            bufferRef.current = value;
          }
        }
        onFocusField?.(path.join("."));
      }}
      onInput={(e: React.FormEvent<HTMLDivElement>) => {
        bufferRef.current = (e.currentTarget.innerText || "");
      }}
      onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const currentText = element.innerText || "";
        // Use bufferRef if available, otherwise use current text
        // Prefer bufferRef as it's the most up-to-date value from onInput
        const text = bufferRef.current || currentText;
        
        // Clean up text (remove placeholder if present)
        const cleanText = text === placeholder ? "" : text.trim();
        
        // Update bufferRef with clean text
        bufferRef.current = cleanText;
        
        // Call onChangeText to update parent state first
        onChangeText?.(path, cleanText);
        onBlurField?.();
        
        // Set isFocused to false immediately to allow useEffect to handle display
        // This ensures smooth transition
        setIsFocused(false);
        
        // Update innerText only if necessary, using requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          if (!elementRef.current) return;
          
          // Only update if the text actually changed
          const shouldShowPlaceholder = !cleanText && placeholder;
          const currentDisplayText = elementRef.current.innerText || "";
          
          if (cleanText && currentDisplayText !== cleanText) {
            elementRef.current.innerText = cleanText;
          } else if (shouldShowPlaceholder && currentDisplayText !== placeholder) {
            // Delay placeholder display slightly to ensure value prop is updated
            setTimeout(() => {
              if (elementRef.current && !value) {
                elementRef.current.innerText = placeholder;
              }
            }, 100);
          }
        });
      }}
      onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    />
  );
}




















