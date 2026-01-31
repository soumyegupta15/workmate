import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";

const SortFilterDropdown = ({ value, onChange }) => {
  const t = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          minWidth: 200,
          padding: `${t.spacing(1.5)} ${t.spacing(3)}`,
          borderRadius: "10px",
          backgroundColor: t.colors.cardBackground,
          border: `1px solid ${t.colors.cardBorder}`,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: t.spacing(2),
          fontSize: t.font.size.sm,
          fontWeight: t.font.weight.medium,
          color: t.colors.textHeadingDark,
          cursor: "pointer",
        }}
      >
        <span>Sort</span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 20,
            minWidth: 260,
            padding: t.spacing(2.5),
            borderRadius: "18px",
            backgroundColor: "#ffffff",
            border: `1px solid ${t.colors.cardBorder}`,
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing(2),
          }}
        >
          <div
            style={{
              fontSize: t.font.size.sm,
              fontWeight: t.font.weight.medium,
              color: t.colors.textHeadingDark,
            }}
          >
            Sort
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing(1),
              fontSize: t.font.size.sm,
              color: t.colors.textBodyDark,
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                name="sort"
                value="due-desc"
                checked={value === "due-desc"}
                onChange={handleChange}
              />
              <span>Due date: Newest to Oldest</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                name="sort"
                value="due-asc"
                checked={value === "due-asc"}
                onChange={handleChange}
              />
              <span>Due date: Oldest to Newest</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

SortFilterDropdown.propTypes = {
  value: PropTypes.oneOf(["due-desc", "due-asc"]),
  onChange: PropTypes.func,
};

SortFilterDropdown.defaultProps = {
  value: "due-desc",
  onChange: undefined,
};

export default SortFilterDropdown;


