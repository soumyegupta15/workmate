import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/theme";

const DeleteOrganisationPopup = ({
  isOpen,
  organisationName,
  onCancel,
  onConfirm,
  isDeleting = false,
}) => {
  const t = useTheme();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        padding: t.spacing(5),
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: t.colors.primary,
          borderRadius: "18px",
          padding: t.spacing(5),
          marginLeft: t.spacing(50),
          color: "#f9fafb",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: t.spacing(3),
            fontSize: t.font.size.lg,
            fontWeight: t.font.weight.regular,
            fontFamily: t.font.family,
          }}
        >
          Delete Organisation
        </h3>

        <div style={{ marginBottom: t.spacing(5) }}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter the organisation name"
            style={{
              width: "100%",
              padding: `${t.spacing(2.5)} ${t.spacing(3)}`,
              borderRadius: "8px",
              border: "1px solid rgba(148, 163, 184, 0.8)",
              backgroundColor: "transparent",
              color: "#f9fafb",
              fontFamily: t.font.family,
              fontSize: t.font.size.md,
              outline: "none",
            }}
          />
        </div>

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
            disabled={isDeleting}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "10px",
              border: "1px solid rgba(148, 163, 184, 0.8)",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              fontSize: t.font.size.md,
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(value)}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#ef0000",
              color: "#ffffff",
              fontSize: t.font.size.md,
              fontWeight: t.font.weight.semiBold,
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: value && !isDeleting ? 1 : 0.7,
            }}
            disabled={!value || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrganisationPopup;
