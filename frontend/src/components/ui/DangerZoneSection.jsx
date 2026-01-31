import React from "react";
import { useTheme } from "../../context/theme";

const DangerZoneSection = ({
  title,
  description,
  buttonLabel,
  onButtonClick,
  disabled = false,
}) => {
  const t = useTheme();

  return (
    <div
      style={{
        marginTop: t.spacing(6),
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: t.spacing(2),
          fontSize: t.font.size.lg,
          color: t.colors.textHeadingDark,
          fontWeight: t.font.weight.regular,
          fontFamily: t.font.family.heading,
        }}
      >
        Danger Zone
      </h3>

      <div
        style={{
          borderRadius: "10px",
          border: `1px solid ${t.colors.dangerBorder}`,
          backgroundColor: t.colors.cardBackground,
          padding: t.spacing(3),
          display: "flex",
          height: "100px",
          alignItems: "center",
          justifyContent: "space-between",
          gap: t.spacing(4),
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              marginBottom: t.spacing(1),
              fontSize: t.font.size.md,
              fontWeight: t.font.weight.medium,
              color: t.colors.textHeadingDark,
            }}
          >
            {title}
          </h4>
          <p
            style={{
              margin: 0,
              color: t.colors.textMutedDark,
              fontSize: t.font.size.sm,
            }}
          >
            {description}
          </p>
        </div>
        <button
          type="button"
          style={{
            padding: `${t.spacing(1.5)} ${t.spacing(5)}`,
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#D40000",
            color: "#FFFFFF",
            fontFamily: t.font.family,
            fontSize: t.font.size.md,
            cursor: disabled ? "not-allowed" : "pointer",
            height: "45px",
            whiteSpace: "nowrap",
            opacity: disabled ? 0.7 : 1,
          }}
          onClick={onButtonClick}
          disabled={disabled}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default DangerZoneSection;


