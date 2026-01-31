import React from "react";
import { useTheme } from "../../context/theme";

const DashboardSectionCard = ({
  title,
  actionLabel,
  onAction,
  actionPosition = "right", // 'right' | 'left'
  actionPlacement = "header", // 'header' | 'bottom-right'
  children,
}) => {
  const t = useTheme();

  const hasHeader = title || (actionLabel && actionPlacement === "header");

  const renderActionButton = () =>
    actionLabel ? (
      <button
        type="button"
        onClick={onAction}
        style={{
          border: "none",
          background: "none",
          color: t.colors.link,
          fontSize: t.font.size.sm,
          fontWeight: t.font.weight.semiBold,
          cursor: "pointer",
        }}
      >
        {actionLabel}
      </button>
    ) : null;

  return (
    <div
      style={{
        backgroundColor: t.colors.cardBackground,
        borderRadius: "18px",
        padding: t.spacing(4),
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
        border: `1px solid ${t.colors.cardBorder}`,
        height: "100%",
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: t.spacing(3),
          }}
        >
          {actionPlacement === "header" &&
            actionPosition === "left" &&
            renderActionButton()}

          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: t.font.size.lg,
                fontWeight: t.font.weight.semiBold,
                color: t.colors.textHeadingDark,
              }}
            >
              {title}
            </h3>
          )}

          {actionPlacement === "header" &&
            actionPosition === "right" &&
            renderActionButton()}
        </div>
      )}

      {children}

      {actionLabel && actionPlacement === "bottom-right" && (
        <div
          style={{
            marginTop: t.spacing(3),
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {renderActionButton()}
        </div>
      )}
    </div>
  );
};

export default DashboardSectionCard;
