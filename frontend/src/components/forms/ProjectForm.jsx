import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";
import { AttachmentUploader, DatePicker, RichTextEditor } from "..";

const ProjectFormField = ({
  label,
  name,
  baseInputStyle,
  labelStyle,
  fieldWrapperStyle,
  inputProps = {},
  inputStyle = {},
}) => {
  const mergedStyle = { ...baseInputStyle, ...inputStyle };

  return (
    <div style={fieldWrapperStyle}>
      {label && (
        <label style={labelStyle} htmlFor={name}>
          {label}
        </label>
      )}
      <input id={name} name={name} style={mergedStyle} {...inputProps} />
    </div>
  );
};

const ProjectForm = ({ formData, onFieldChange, memberOptions = [] }) => {
  const t = useTheme();

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    onFieldChange?.(field, value);
  };

  const handleDescriptionChange = (value) => {
    onFieldChange?.("description", value);
  };

  const selected = formData.teamMembers || [];

  const filteredMemberOptions = useMemo(() => {
    const q = String(formData.teamSearch || "").trim().toLowerCase();
    if (!q) return [];
    const selectedSet = new Set(selected.map((s) => String(s).toLowerCase()));
    return (memberOptions || [])
      .filter((m) => m && m.email)
      .filter((m) => !selectedSet.has(String(m.email).toLowerCase()))
      .filter((m) => {
        const hay = `${m.name || ""} ${m.email || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [formData.teamSearch, memberOptions, selected]);

  const addMember = (email) => {
    const e = String(email || "").trim();
    if (!e) return;
    const current = formData.teamMembers || [];
    if (!current.includes(e)) {
      onFieldChange?.("teamMembers", [...current, e]);
    }
    onFieldChange?.("teamSearch", "");
  };

  const handleTeamSearchKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
      event.preventDefault();
      if (filteredMemberOptions.length > 0) {
        addMember(filteredMemberOptions[0].email);
      }
    } else if (
      event.key === "Backspace" &&
      !formData.teamSearch &&
      (formData.teamMembers || []).length
    ) {
      const next = [...(formData.teamMembers || [])];
      next.pop();
      onFieldChange?.("teamMembers", next);
    }
  };

  const handleRemoveMember = (member) => {
    const next = (formData.teamMembers || []).filter((m) => m !== member);
    onFieldChange?.("teamMembers", next);
  };

  const baseInputStyle = {
    width: "100%",
    padding: t.spacing(3),
    borderRadius: "8px",
    border: `1px solid ${t.colors.blackBorder}`,
    backgroundColor: "transparent",
    fontFamily: t.font.family,
    fontSize: t.font.size.md,
    color: "#111827",
    outline: "none",
  };

  const labelStyle = {
    fontSize: t.font.size.sm,
    color: "#111827",
    fontWeight: t.font.weight.medium,
    marginBottom: t.spacing(1),
  };

  const fieldWrapperStyle = {
    display: "flex",
    flexDirection: "column",
    gap: t.spacing(1),
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: `${t.spacing(1)} ${t.spacing(2.5)}`,
    borderRadius: "999px",
    backgroundColor: "#e5e7eb",
    color: "#1f2937",
    fontSize: t.font.size.sm,
    marginRight: t.spacing(1.5),
  };

  const chipRemoveButtonStyle = {
    marginLeft: t.spacing(1),
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "12px",
    lineHeight: 1,
    color: "#4b5563",
  };

  return (
    <>
      <div style={{ marginBottom: t.spacing(4) }}>
        <ProjectFormField
          label="Project Name"
          name="projectName"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          inputProps={{
            type: "text",
            value: formData.projectName,
            onChange: handleChange("projectName"),
            placeholder: "Enter the project's name",
          }}
        />
      </div>

      <div style={{ marginBottom: t.spacing(4) }}>
        <label style={labelStyle} htmlFor="description">
          Description
        </label>
        <RichTextEditor
          id="description"
          value={formData.description}
          placeholder="Provide a short description for the project"
          onChange={handleDescriptionChange}
          wrapperStyle={{
            marginTop: t.spacing(1),
          }}
          minHeight={140}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: t.spacing(4),
          marginBottom: t.spacing(4),
        }}
      >
        <DatePicker
          label="Start Date"
          name="startDate"
          value={formData.startDate}
          onChange={(value) => onFieldChange?.("startDate", value)}
        />
        <DatePicker
          label="End Date"
          name="endDate"
          value={formData.endDate}
          onChange={(value) => onFieldChange?.("endDate", value)}
        />
      </div>

      <div style={{ marginBottom: t.spacing(4) }}>
        <div style={{ position: "relative" }}>
          <ProjectFormField
            label="Team Members"
            name="teamSearch"
            baseInputStyle={baseInputStyle}
            labelStyle={labelStyle}
            fieldWrapperStyle={fieldWrapperStyle}
            inputProps={{
              type: "text",
              value: formData.teamSearch,
              onChange: handleChange("teamSearch"),
              onKeyDown: handleTeamSearchKeyDown,
              placeholder: "Search and select organisation members...",
              autoComplete: "off",
            }}
          />
          {String(formData.teamSearch || "").trim() && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                backgroundColor: "#ffffff",
                border: `1px solid ${t.colors.blackBorder}`,
                borderRadius: "12px",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {filteredMemberOptions.length === 0 ? (
                <div
                  style={{
                    padding: t.spacing(3),
                    color: "#6b7280",
                    fontSize: t.font.size.sm,
                  }}
                >
                  No matching members.
                </div>
              ) : (
                filteredMemberOptions.map((m) => (
                  <button
                    key={m.id || m.email}
                    type="button"
                    onClick={() => addMember(m.email)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: t.spacing(3),
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: t.font.size.md, color: "#111827" }}>
                      {m.name || m.email}
                    </div>
                    {m.name ? (
                      <div style={{ fontSize: t.font.size.sm, color: "#6b7280" }}>
                        {m.email}
                      </div>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: t.spacing(2),
            display: "flex",
            flexWrap: "wrap",
            gap: t.spacing(1.5),
          }}
        >
          {(formData.teamMembers || []).map((member) => (
            <span key={member} style={chipStyle}>
              {member}
              <button
                type="button"
                style={chipRemoveButtonStyle}
                onClick={() => handleRemoveMember(member)}
                aria-label={`Remove ${member}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: t.spacing(6) }}>
        <AttachmentUploader
          label="Attachments"
          attachments={formData.attachments || []}
          onChange={(files) => onFieldChange?.("attachments", files)}
        />
      </div>
    </>
  );
};

ProjectForm.propTypes = {
  formData: PropTypes.shape({
    projectName: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    teamSearch: PropTypes.string,
    teamMembers: PropTypes.arrayOf(PropTypes.string),
    attachments: PropTypes.array,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  memberOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      email: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

export default ProjectForm;


