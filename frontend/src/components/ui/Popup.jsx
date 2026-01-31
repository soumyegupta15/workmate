import React from "react";
import { useTheme } from "../../context/theme";

const Popup = ({ isOpen, onClose, title, maxWidth = "640px", children }) => {
  const t = useTheme();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: t.colors.popupBackground,
          borderRadius: "18px",
          padding: t.spacing(4),
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
          border: `1px solid ${t.colors.cardBorder}`,
          marginLeft: t.spacing(60),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: t.spacing(3),
          }}
        >
          {title && (
            <h2
              style={{
                margin: 0,
                fontSize: t.font.size.lg,
                fontWeight: t.font.weight.semiBold,
                color: t.colors.textHeadingDark,
                fontFamily: t.font.family,
              }}
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: t.colors.textMutedDark,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Popup;
