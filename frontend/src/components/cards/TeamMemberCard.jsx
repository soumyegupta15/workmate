import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/theme";
import deleteIcon from "../../assets/icons/deleteIcon.png";

const TeamMemberCard = ({ member, onRemove }) => {
  const t = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleRemoveClick = () => {
    if (onRemove) {
      onRemove(member);
    }
    setMenuOpen(false);
  };

  const getStatusChipStyles = (status) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          backgroundColor: "rgba(34, 197, 94, 0.12)",
          color: "#16a34a",
        };
      case "pending":
        return {
          label: "Pending Invite",
          backgroundColor: "rgba(251, 191, 36, 0.16)",
          color: "#d97706",
        };
      case "inactive":
      default:
        return {
          label: "Inactive",
          backgroundColor: "rgba(156, 163, 175, 0.16)",
          color: "#4b5563",
        };
    }
  };

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusStyles = getStatusChipStyles(member.status);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      style={{
        backgroundColor: t.colors.cardBackground,
        borderRadius: "18px",
        padding: t.spacing(4),
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
        border: `1px solid ${t.colors.cardBorder}`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: t.spacing(3),
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* 3-dots menu trigger */}
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          top: t.spacing(2),
          right: t.spacing(2),
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          style={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: t.colors.textMutedDark,
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ⋮
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              backgroundColor: t.colors.cardBackground,
              borderRadius: "10px",
              padding: t.spacing(2),
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
              border: `1px solid ${t.colors.cardBorder}`,
              zIndex: 1,
            }}
          >
            <button
              type="button"
              onClick={handleRemoveClick}
              style={{
                width: "100%",
                borderRadius: 6,
                backgroundColor: "transparent",
                border: "none",
                fontFamily: t.font.family.poppins,
                fontSize: t.font.size.sm,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: t.spacing(1.5),
              }}
            >
              <span>Remove</span>
              <img
                src={deleteIcon}
                alt="Remove"
                style={{
                  width: 14,
                  height: 14,
                  objectFit: "contain",
                }}
              />
            </button>
          </div>
        )}
      </div>
      {/* Avatar */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "999px",
          background: member.avatarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: "32px",
          fontWeight: t.font.weight.semiBold,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
        }}
      >
        {initials}
      </div>

      {/* Name & role */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semiBold,
            color: t.colors.textHeadingDark,
            marginBottom: t.spacing(0.5),
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: t.font.size.sm,
            color: t.colors.textMutedDark,
            marginBottom: t.spacing(1.5),
          }}
        >
          {member.role}
        </div>
      </div>

      {/* Status pill */}
      <div
        style={{
          marginTop: t.spacing(1),
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `${t.spacing(0.5)} ${t.spacing(2)}`,
            borderRadius: "999px",
            fontSize: t.font.size.xs,
            fontWeight: t.font.weight.medium,
            backgroundColor: statusStyles.backgroundColor,
            color: statusStyles.color,
            minWidth: 92,
          }}
        >
          {statusStyles.label}
        </span>
      </div>
    </div>
  );
};

export default TeamMemberCard;
