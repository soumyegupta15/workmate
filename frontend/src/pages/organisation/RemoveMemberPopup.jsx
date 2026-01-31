import React from "react";
import { useTheme } from "../../context/theme";

const RemoveMemberPopup = ({ isOpen, onCancel, onConfirm, memberName }) => {
  const t = useTheme();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        border: "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          backgroundColor: t.colors.primary,
          borderRadius: "18px",
          padding: t.spacing(6),
          marginLeft: t.spacing(50),
          color: t.colors.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: t.spacing(2),
            fontSize: t.font.size.xl,
            fontWeight: t.font.weight.semiBold,
            fontFamily: t.font.family,
          }}
        >
          Remove Member
        </h2>

        <p
          style={{
            margin: 0,
            marginBottom: t.spacing(6),
            fontSize: t.font.size.md,
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to remove{" "}
          <span style={{ fontWeight: t.font.weight.semiBold }}>
            {memberName || "this member"}
          </span>
          ? This action cannot be undone.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: t.spacing(4),
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "999px",
              border: `1px solid ${t.colors.borderLight}`,
              backgroundColor: "transparent",
              color: t.colors.textPrimary,
              fontSize: t.font.size.md,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#b91c1c",
              color: "#ffffff",
              fontSize: t.font.size.md,
              fontWeight: t.font.weight.semiBold,
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberPopup;


