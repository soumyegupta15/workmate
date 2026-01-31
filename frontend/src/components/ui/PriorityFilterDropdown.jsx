import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";

const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const PriorityFilterDropdown = ({ selected, onChange }) => {
  const t = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = (value) => {
    if (!onChange) return;

    const isSelected = selected.includes(value);
    const next = isSelected
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(next);
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
          minWidth: 180,
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
        <span>Priority</span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 20,
            minWidth: 220,
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
            Priority
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
            {PRIORITY_OPTIONS.map((label) => (
              <label
                key={label}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(label)}
                  onChange={() => handleToggle(label)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

PriorityFilterDropdown.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};

PriorityFilterDropdown.defaultProps = {
  selected: PRIORITY_OPTIONS,
  onChange: undefined,
};

export default PriorityFilterDropdown;


