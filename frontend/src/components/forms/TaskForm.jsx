import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";
import { AttachmentUploader, DatePicker, RichTextEditor } from "..";

const TaskFormField = ({
  label,
  name,
  baseInputStyle,
  labelStyle,
  fieldWrapperStyle,
  inputProps = {},
  inputStyle = {},
  required = false,
}) => {
  const mergedStyle = { ...baseInputStyle, ...inputStyle };

  return (
    <div style={fieldWrapperStyle}>
      {label && (
        <label style={labelStyle} htmlFor={name}>
          {label}
          {required ? <span style={{ color: "#dc2626" }}> *</span> : null}
        </label>
      )}
      <input id={name} name={name} style={mergedStyle} {...inputProps} />
    </div>
  );
};

const TaskForm = ({ formData, onFieldChange, memberOptions = [] }) => {
  const t = useTheme();
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    onFieldChange?.(field, value);
  };

  const handleDescriptionChange = (value) => {
    onFieldChange?.("description", value);
  };

  const selectedEmail =
    Array.isArray(formData.assignees) && formData.assignees.length > 0
      ? String(formData.assignees[0] || "").trim()
      : "";

  const selectedMember = useMemo(() => {
    if (!selectedEmail) return null;
    const needle = selectedEmail.toLowerCase();
    return (memberOptions || []).find(
      (m) => m?.email && String(m.email).toLowerCase() === needle
    );
  }, [memberOptions, selectedEmail]);

  // If we already have an assignee email (e.g. Edit Task), show the member name in the field.
  useEffect(() => {
    if (!selectedMember?.name) return;
    const current = String(formData.assigneeSearch || "").trim();
    if (!current) {
      onFieldChange?.("assigneeSearch", selectedMember.name);
    }
  }, [formData.assigneeSearch, onFieldChange, selectedMember]);

  const filteredAssigneeOptions = useMemo(() => {
    const q = String(formData.assigneeSearch || "").trim().toLowerCase();

    const rows = (memberOptions || []).filter((m) => m && m.email);
    const filtered = !q
      ? rows
      : rows.filter((m) => {
          const hay = `${m.name || ""} ${m.email || ""}`.toLowerCase();
          return hay.includes(q);
        });

    // Do not show the already-selected member in options.
    const needle = selectedEmail ? selectedEmail.toLowerCase() : "";
    return filtered
      .filter((m) => !needle || String(m.email).toLowerCase() !== needle)
      .slice(0, 12);
  }, [formData.assigneeSearch, memberOptions, selectedEmail]);

  const selectAssignee = (member) => {
    const email = String(member?.email || "").trim();
    if (!email) return;
    onFieldChange?.("assignees", [email]);
    onFieldChange?.("assigneeSearch", member?.name || email);
    setIsAssigneeOpen(false);
  };

  const clearAssignee = () => {
    onFieldChange?.("assignees", []);
    onFieldChange?.("assigneeSearch", "");
  };

  const handleAssigneeKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredAssigneeOptions.length > 0) {
        selectAssignee(filteredAssigneeOptions[0]);
      }
    } else if (event.key === "Escape") {
      setIsAssigneeOpen(false);
    } else if (event.key === "Backspace") {
      const q = String(formData.assigneeSearch || "");
      if (!q && selectedEmail) {
        clearAssignee();
      }
    }
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
        <TaskFormField
          label="Task Name"
          name="taskName"
          baseInputStyle={baseInputStyle}
          labelStyle={labelStyle}
          fieldWrapperStyle={fieldWrapperStyle}
          required
          inputProps={{
            type: "text",
            value: formData.taskName,
            onChange: handleChange("taskName"),
            placeholder: "Enter the task's name",
          }}
        />
      </div>

      <div style={{ marginBottom: t.spacing(4) }}>
        <label style={labelStyle} htmlFor="description">
          Description<span style={{ color: "#dc2626" }}> *</span>
        </label>
        <RichTextEditor
          id="description"
          value={formData.description}
          placeholder="Provide a short description for the task"
          onChange={handleDescriptionChange}
          wrapperStyle={{
            marginTop: t.spacing(1),
          }}
          minHeight={140}
        />
      </div>

      <div style={{ marginBottom: t.spacing(4) }}>
        <div style={{ position: "relative" }}>
          <TaskFormField
            label="Assignee"
            name="assigneeSearch"
            baseInputStyle={baseInputStyle}
            labelStyle={labelStyle}
            fieldWrapperStyle={fieldWrapperStyle}
            required
            inputProps={{
              type: "text",
              value: formData.assigneeSearch,
              onChange: handleChange("assigneeSearch"),
              onKeyDown: handleAssigneeKeyDown,
              onFocus: () => setIsAssigneeOpen(true),
              onBlur: () => {
                // Give click handlers time to run before closing
                window.setTimeout(() => setIsAssigneeOpen(false), 120);
              },
              placeholder: "Select a project member...",
              autoComplete: "off",
            }}
          />

          {selectedEmail ? (
            <button
              type="button"
              onClick={clearAssignee}
              style={{
                position: "absolute",
                right: t.spacing(3),
                top: "50%",
                transform: "translateY(-5%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: 16,
                lineHeight: 1,
              }}
              aria-label="Clear assignee"
              title="Clear"
            >
              ×
            </button>
          ) : null}

          {isAssigneeOpen && (
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
              {filteredAssigneeOptions.length === 0 ? (
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
                filteredAssigneeOptions.map((m) => (
                  <button
                    key={m.id || m.email}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectAssignee(m)}
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
          label="Start Date *"
          name="startDate"
          value={formData.startDate}
          onChange={(value) => onFieldChange?.("startDate", value)}
        />
        <DatePicker
          label="Due Date *"
          name="dueDate"
          value={formData.dueDate}
          onChange={(value) => onFieldChange?.("dueDate", value)}
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
        <div style={fieldWrapperStyle}>
          <label style={labelStyle} htmlFor="priority">
            Priority<span style={{ color: "#dc2626" }}> *</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange("priority")}
            style={{
              ...baseInputStyle,
              paddingRight: t.spacing(2),
            }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div style={fieldWrapperStyle}>
          <label style={labelStyle} htmlFor="status">
            Status<span style={{ color: "#dc2626" }}> *</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange("status")}
            style={{
              ...baseInputStyle,
              paddingRight: t.spacing(2),
            }}
          >
            <option value="To do">To do</option>
            <option value="In progress">In progress</option>
            <option value="In review">In review</option>
            <option value="Done">Done</option>
          </select>
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

TaskForm.propTypes = {
  formData: PropTypes.shape({
    taskName: PropTypes.string,
    description: PropTypes.string,
    assigneeSearch: PropTypes.string,
    assignees: PropTypes.arrayOf(PropTypes.string),
    startDate: PropTypes.string,
    dueDate: PropTypes.string,
    priority: PropTypes.string,
    status: PropTypes.string,
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

export default TaskForm;


