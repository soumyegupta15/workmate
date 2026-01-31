import React from "react";
import { useTheme } from "../../context/theme";
import searchIcon from "../../assets/icons/searchIcon.png";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  const t = useTheme();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "600px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: t.spacing(3),
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          width: "20px",
          height: "20px",
        }}
      >
        <img
          src={searchIcon}
          alt="Search"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            opacity: 0.7,
          }}
          onError={(e) => {
            console.error("Search icon failed to load");
            e.target.style.display = "none";
          }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: `${t.spacing(3)} ${t.spacing(3)} ${t.spacing(3)} ${t.spacing(
            12
          )}`,
          outline: "none",
          background: "#FAFEFF33",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: "#1f2937",
          fontSize: t.font.size.md,
          fontFamily: t.font.family, // Poppins
          boxSizing: "border-box",
          transition: "all 0.3s ease",
          backgroundColor: t.colors.cardBackground,
          borderRadius: "18px",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
          border: `1px solid ${t.colors.cardBorder}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
          e.currentTarget.style.boxShadow =
            "0 6px 24px 0 rgba(31, 38, 135, 0.4), " +
            "inset 0 2px 6px rgba(255, 255, 255, 0.6), " +
            "inset 0 -2px 6px rgba(0, 0, 0, 0.12), " +
            "inset 2px 0 6px rgba(255, 255, 255, 0.4), " +
            "inset -2px 0 6px rgba(0, 0, 0, 0.08)";
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
          e.currentTarget.style.boxShadow =
            "0 4px 16px 0 rgba(31, 38, 135, 0.3), " +
            "inset 0 2px 4px rgba(255, 255, 255, 0.5), " +
            "inset 0 -2px 4px rgba(0, 0, 0, 0.1), " +
            "inset 2px 0 4px rgba(255, 255, 255, 0.3), " +
            "inset -2px 0 4px rgba(0, 0, 0, 0.05)";
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        }}
      />
    </div>
  );
};

export default SearchBar;
