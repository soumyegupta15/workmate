import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { AttachmentList, DashboardSectionCard, PrimaryButton, TaskForm } from "../../components";
import { useTheme } from "../../context/theme";
import { getOrganisationById } from "../../services/orgService";
import { getProjectById } from "../../services/projectService";
import { listProjectMembers } from "../../services/projectMemberService";
import { getTaskById, updateTaskById } from "../../services/taskService";
import { uploadAttachments } from "../../services/attachmentService";

const readRichTextHtml = (rootId) => {
  try {
    const el = document.querySelector(`#${rootId} .ql-editor`);
    const html = el?.innerHTML || "";
    if (!html || html === "<p><br></p>") return "";
    return html;
  } catch {
    return "";
  }
};

const baseInitialFormData = {
  taskName: "",
  description: "",
  assigneeSearch: "",
  assignees: [],
  startDate: "",
  dueDate: "",
  priority: "Medium",
  status: "To do",
  attachments: [],
};

const statusLabel = (value) => {
  const v = String(value || "").trim();
  if (!v) return "To do";
  const norm = v.toLowerCase().replace(/\s+/g, "_");
  if (norm === "todo" || norm === "to_do") return "To do";
  if (norm === "in_progress" || norm === "in-progress") return "In Progress";
  if (norm === "in_review") return "In Review";
  if (norm === "done") return "Done";
  return v;
};

const toTaskStatusEnum = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (s === "to do" || s === "todo") return "todo";
  if (s === "in progress" || s === "in_progress") return "in_progress";
  if (s === "in review" || s === "in_review") return "in_review";
  if (s === "done") return "done";
  return s ? s.replace(/\s+/g, "_") : null;
};

const priorityLabel = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  // backend supports urgent; keep layout same by surfacing as High
  if (v === "urgent") return "High";
  return value || "Medium";
};

const toTaskPriorityEnum = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  if (s === "low") return "low";
  if (s === "urgent") return "urgent";
  return s || null;
};

const EditTask = () => {
  const t = useTheme();
  const { id, projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState(location.state?.projectName || "");
  const [memberOptions, setMemberOptions] = useState([]);
  const taskFromState = location.state?.task || {};
  const [task, setTask] = useState(taskFromState || null);
  const [existingAttachments, setExistingAttachments] = useState(taskFromState?.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    const tid = taskId;
    if (!orgId || !pid || !tid) return;
    let cancelled = false;
    (async () => {
      try {
        setError("");
        const [orgRes, projRes, membersRes, taskRes] = await Promise.all([
          getOrganisationById(orgId),
          getProjectById(pid),
          listProjectMembers({ projectId: pid }),
          getTaskById(tid),
        ]);
        if (cancelled) return;
        setOrgName(orgRes?.data?.org_name || "");
        setProjName(projRes?.data?.name || "");

        const rows = Array.isArray(membersRes?.data) ? membersRes.data : [];
        const options = rows
          .map((r) => r?.user)
          .filter((u) => u && u.email)
          .map((u) => ({ id: u.id, email: u.email, name: u.name }));
        setMemberOptions(options);

        const loadedTask = taskRes?.data || null;
        setTask(loadedTask);
        setExistingAttachments(Array.isArray(loadedTask?.attachments) ? loadedTask.attachments : []);
      } catch {
        if (!cancelled) {
          setError("Failed to load task.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, projectId, taskId]);

  const breadcrumbLabel = `${orgName || "Organisation"} / ${projName || "Project"} /`;

  const [formData, setFormData] = useState(baseInitialFormData);

  useEffect(() => {
    const src = task || taskFromState || null;
    if (!src) return;
    setFormData((prev) => ({
      ...prev,
      taskName: src.title || "",
      description: src.description || "",
      dueDate: src.due_date || src.dueDate || "",
      priority: priorityLabel(src.priority),
      status: statusLabel(src.status),
      // only new files should go here; existing are shown separately
      attachments: [],
      assignees: src.assignee?.email ? [src.assignee.email] : [],
    }));
  }, [task, taskFromState]);

  const headerBreadcrumb = `Edit Task`;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }

    const submit = async () => {
      if (!taskId) return;
      setIsSubmitting(true);
      setError("");
      try {
        const editorHtml = readRichTextHtml("description");
        const descriptionHtml =
          typeof formData.description === "string" && formData.description.trim() !== ""
            ? formData.description
            : editorHtml;

        const assigneeEmail =
          Array.isArray(formData.assignees) && formData.assignees.length > 0
            ? String(formData.assignees[0] || "").trim()
            : "";

        if (!String(formData.taskName || "").trim()) {
          setError("Task Name is required.");
          return;
        }
        if (!descriptionHtml || descriptionHtml === "<p><br></p>") {
          setError("Description is required.");
          return;
        }
        if (!assigneeEmail) {
          setError("Assignee is required.");
          return;
        }
        if (!formData.dueDate) {
          setError("Due Date is required.");
          return;
        }
        if (!formData.priority) {
          setError("Priority is required.");
          return;
        }
        if (!formData.status) {
          setError("Status is required.");
          return;
        }

        const payload = {
          title: formData.taskName,
          description: descriptionHtml,
          about: descriptionHtml,
          status: toTaskStatusEnum(formData.status),
          priority: toTaskPriorityEnum(formData.priority),
          dueDate: formData.dueDate || null,
          projectId: projectId || null,
          assigneeEmail: assigneeEmail || undefined,
        };

        const updatedRes = await updateTaskById(taskId, payload);
        const updatedTask = updatedRes?.data || null;

        const files = Array.isArray(formData.attachments) ? formData.attachments : [];
        if (files.length > 0) {
          try {
            await uploadAttachments({ files, entityType: "task", entityId: taskId });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload task attachments:", e);
          }
        }

        navigate(`/organisations/${id}/projects/${projectId}/tasks/${taskId}`, {
          state: { projectName: projName, task: updatedTask || taskFromState },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to update task:", err);
        setError(err?.message || "Failed to update task.");
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  const handleCancel = () => {
    navigate(`/organisations/${id}/projects/${projectId}/tasks/${taskId}`, {
      state: { projectName: projName, task: taskFromState },
    });
  };

  return (
    <OrganisationLayout
      organisationName={breadcrumbLabel}
      pageTitle={headerBreadcrumb}
      searchPlaceholder=""
      searchValue=""
      onSearchChange={undefined}
    >
      <p
        style={{
          margin: 0,
          marginBottom: t.spacing(4),
          color: t.colors.textMutedDark,
          fontSize: t.font.size.sm,
        }}
      >
        Update details for{" "}
        <strong>{orgName || "Organisation"}</strong> / <strong>{projName || "Project"}</strong>.
      </p>

      <DashboardSectionCard title="">
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                marginBottom: t.spacing(2),
                padding: t.spacing(2),
                borderRadius: t.radius.card,
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          {Array.isArray(existingAttachments) && existingAttachments.length > 0 ? (
            <div style={{ marginBottom: t.spacing(4) }}>
              <h4
                style={{
                  margin: 0,
                  marginBottom: t.spacing(2),
                  fontSize: t.font.size.sm,
                  fontWeight: t.font.weight.semiBold,
                  color: t.colors.textHeadingDark,
                }}
              >
                Existing Attachments
              </h4>
              <AttachmentList attachments={existingAttachments} />
            </div>
          ) : null}

          <TaskForm
            formData={formData}
            onFieldChange={handleFieldChange}
            memberOptions={memberOptions}
          />

          <div
            style={{
              marginTop: t.spacing(4),
              display: "flex",
              justifyContent: "flex-end",
              gap: t.spacing(3),
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                padding: `${t.spacing(2.5)} ${t.spacing(6)}`,
                borderRadius: t.radius.button,
                border: "1px solid #cbd5f5",
                backgroundColor: "#fff",
                color: "#111827",
                fontFamily: t.font.family,
                fontSize: t.font.size.md,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
            <PrimaryButton type="submit" fullWidth={false} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </DashboardSectionCard>
    </OrganisationLayout>
  );
};

export default EditTask;


