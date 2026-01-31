import React, { useState } from "react";
import { useTheme } from "../../context/theme";
import copyIcon from "../../assets/icons/copyIcon.png";

const CopyableRow = ({ icon, children, copyValue, align = "center" }) => {
  const t = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: align,
        gap: t.spacing(1),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && (
        <span
          style={{
            fontSize: "16px",
            lineHeight: align === "flex-start" ? 1.4 : 1,
          }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          border: "none",
          background: "none",
          padding: 0,
          cursor: "pointer",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 150ms ease-out",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img
          src={copyIcon}
          alt="Copy"
          style={{ width: 18, height: 18, marginLeft: t.spacing(2) }}
        />
      </button>
      {copied && (
        <span
          style={{
            fontSize: t.font.size.xs,
            color: t.colors.accentBlue,
            marginLeft: t.spacing(1),
          }}
        >
          Copied
        </span>
      )}
    </div>
  );
};

export default CopyableRow;
