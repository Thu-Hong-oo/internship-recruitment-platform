import { useRef } from "react";

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
  const Tag = block ? "div" : "span";
  return (
    <Tag
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      className={className}
      style={style}
      onFocus={() => {
        bufferRef.current = value || "";
        onFocusField?.(path.join("."));
      }}
      onInput={(e: React.FormEvent<HTMLDivElement>) => {
        bufferRef.current = (e.currentTarget.innerText || "");
      }}
      onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
        const text = bufferRef.current || e.currentTarget.innerText || "";
        onChangeText?.(path, text);
        onBlurField?.();
      }}
      onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    >
      {value || placeholder || ""}
    </Tag>
  );
}














