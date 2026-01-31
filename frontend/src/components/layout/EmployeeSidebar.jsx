import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/theme";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/icons/logo.png";

const EmployeeSidebar = ({
  projects = [],
  selectedProjectId,
  onSelectProject,
}) => {
  const t = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const sortedProjects = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    return [...list].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [projects]);

  return (
    <div
      style={{
        width: "320px",
        height: "100vh",
        backgroundColor: t.colors.primary,
        display: "flex",
        flexDirection: "column",
        padding: t.spacing(4),
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: t.spacing(6),
          paddingBottom: t.spacing(4),
          borderBottom: `1px solid ${t.colors.cardBorder}`,
        }}
      >
        <img
          src={logo}
          alt="Workmate AI logo"
          style={{ height: 110, objectFit: "contain" }}
        />
      </div>

      <div
        style={{
          marginTop: t.spacing(2),
          marginBottom: t.spacing(2),
          color: t.colors.textMuted,
          fontSize: t.font.size.xs,
          fontFamily: t.font.family,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        My Projects
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: t.spacing(1),
          overflowY: "auto",
          paddingRight: 2,
          flex: 1,
        }}
      >
        {sortedProjects.length === 0 ? (
          <div style={{ color: t.colors.textMuted, fontSize: t.font.size.sm }}>
            No projects assigned.
          </div>
        ) : (
          sortedProjects.map((p) => {
            const active = String(p?.id) === String(selectedProjectId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject?.(p)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: t.spacing(2.5),
                  backgroundColor: active ? "#374151" : "transparent",
                  border: "none",
                  borderRadius: t.radius.input,
                  color: t.colors.textPrimary,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: t.font.size.sm, fontWeight: t.font.weight.semiBold }}>
                  {p.name || "Project"}
                </div>
                <div style={{ fontSize: t.font.size.xs, color: t.colors.textMuted }}>
                  {p.org_name || "Organisation"}
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: t.spacing(3),
          padding: t.spacing(3),
          backgroundColor: "transparent",
          border: "none",
          borderRadius: t.radius.input,
          color: t.colors.textPrimary,
          fontSize: t.font.size.md,
          fontFamily: t.font.family,
          cursor: "pointer",
          textAlign: "left",
          marginTop: t.spacing(2),
        }}
      >
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default EmployeeSidebar;


