import React, { useState } from "react";
import { useTheme } from "../context/theme";
import { EmployeeSidebar } from "../components/layout";
import { ProfileDropdown, SearchBar } from "../components";
import sampleProfile from "../assets/images/sampleProfile.png";

const EmployeeLayout = ({
  pageTitle = "Employee Dashboard",
  primaryActionLabel,
  primaryActionDisabled = false,
  onPrimaryAction,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  projects = [],
  selectedProjectId,
  onSelectProject,
  children,
}) => {
  const t = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: t.colors.pageBackground,
        fontFamily: t.font.family,
      }}
    >
      <EmployeeSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: t.spacing(6),
            minHeight: "100vh",
            backgroundColor: t.colors.backgroundColor,
          }}
        >
          <div style={{ marginBottom: t.spacing(4) }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: t.spacing(4),
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: t.font.size.display,
                  fontWeight: t.font.weight.bold,
                  color: t.colors.textHeadingDark,
                  fontFamily: t.font.heading,
                }}
              >
                {pageTitle}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: t.spacing(3) }}>
                {primaryActionLabel ? (
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    disabled={primaryActionDisabled}
                    style={{
                      padding: `${t.spacing(2)} ${t.spacing(5)}`,
                      borderRadius: t.radius.button,
                      border: "none",
                      backgroundColor: t.colors.primary,
                      color: "#ffffff",
                      cursor: primaryActionDisabled ? "not-allowed" : "pointer",
                      opacity: primaryActionDisabled ? 0.7 : 1,
                      fontFamily: t.font.family,
                      fontSize: t.font.size.md,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {primaryActionLabel}
                  </button>
                ) : null}

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "999px",
                      border: "2px solid #d1d5db",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img
                      src={sampleProfile}
                      alt="Profile"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "contain",
                      }}
                    />
                  </button>
                  {isProfileOpen && (
                    <ProfileDropdown onClose={() => setIsProfileOpen(false)} />
                  )}
                </div>
              </div>
            </div>

            {searchPlaceholder && onSearchChange ? (
              <div style={{ marginTop: t.spacing(4), maxWidth: "720px" }}>
                <SearchBar
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: t.spacing(2) }}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLayout;


