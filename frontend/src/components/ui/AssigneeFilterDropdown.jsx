import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";

const DEFAULT_ASSIGNEES = ["John Doe", "Mark Ross", "Emily"];

const AssigneeFilterDropdown = ({
  search,
  selected,
  options,
  onSearchChange,
  onSelectedChange,
}) => {
  const t = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = (name) => {
    if (!onSelectedChange) return;

    const isSelected = selected.includes(name);
    const next = isSelected
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    onSelectedChange(next);
  };

  const handleSearchChange = (event) => {
    onSearchChange?.(event.target.value);
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
          minWidth: 220,
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
        <span>Assignee</span>
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
            Assignee
          </div>
          <input
            type="text"
            placeholder="Search for assignee"
            value={search}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: `${t.spacing(1.5)} ${t.spacing(2.5)}`,
              borderRadius: "8px",
              border: `1px solid ${t.colors.blackBorder}`,
              backgroundColor: "transparent",
              fontFamily: t.font.family,
              fontSize: t.font.size.sm,
              color: t.colors.textBodyDark,
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing(1),
              fontSize: t.font.size.sm,
              color: t.colors.textBodyDark,
            }}
          >
            {(Array.isArray(options) && options.length ? options : DEFAULT_ASSIGNEES)
              .filter((name) => {
                const q = String(search || "").trim().toLowerCase();
                if (!q) return true;
                return String(name || "").toLowerCase().includes(q);
              })
              .map((name) => (
              <label
                key={name}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(name)}
                  onChange={() => handleToggle(name)}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

AssigneeFilterDropdown.propTypes = {
  search: PropTypes.string,
  selected: PropTypes.arrayOf(PropTypes.string),
  options: PropTypes.arrayOf(PropTypes.string),
  onSearchChange: PropTypes.func,
  onSelectedChange: PropTypes.func,
};

AssigneeFilterDropdown.defaultProps = {
  search: "",
  selected: [],
  options: undefined,
  onSearchChange: undefined,
  onSelectedChange: undefined,
};

export default AssigneeFilterDropdown;


