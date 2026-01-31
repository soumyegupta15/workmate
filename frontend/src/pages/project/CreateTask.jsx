import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { DashboardSectionCard, PrimaryButton, TaskForm } from "../../components";
import { useTheme } from "../../context/theme";
import addIcon from "../../assets/icons/addIcon.png";
import { createTask } from "../../services/taskService";
import { getOrganisationById } from "../../services/orgService";
import { getProjectById } from "../../services/projectService";
import { listProjectMembers } from "../../services/projectMemberService";
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

const initialFormData = {
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

const CreateTask = () => {
  const t = useTheme();
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from;
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState(location.state?.projectName || "");
  const [memberOptions, setMemberOptions] = useState([]);

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    if (!orgId || !pid) return;
    let cancelled = false;
    (async () => {
      try {
        const [orgRes, projRes, membersRes] = await Promise.all([
          getOrganisationById(orgId),
          getProjectById(pid),
          listProjectMembers({ projectId: pid }),
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
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, projectId]);

  const breadcrumbLabel = `${orgName || "Organisation"} / ${projName || "Project"} /`;
  const headerTitle = "Create New Task";

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

  const toTaskPriorityEnum = (v) => {
    const s = String(v || "").trim().toLowerCase();
    if (s === "high") return "high";
    if (s === "medium") return "medium";
    if (s === "low") return "low";
    if (s === "urgent") return "urgent";
    return s || null;
  };

  const toTaskStatusEnum = (v) => {
    const s = String(v || "").trim().toLowerCase();
    if (s === "to do" || s === "todo") return "todo";
    if (s === "in progress" || s === "in_progress") return "in_progress";
    if (s === "in review" || s === "in_review") return "in_progress";
    if (s === "done") return "done";
    return s ? s.replace(/\s+/g, "_") : null;
  };

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
      setIsSubmitting(true);
      setError("");
      try {
        // Ensure latest Quill HTML is used
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
        if (!assigneeEmail || !isValidEmail(assigneeEmail)) {
          setError("Assignee is required (must be a valid email).");
          return;
        }
        if (!formData.startDate) {
          setError("Start Date is required.");
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

        const createdRes = await createTask(payload);
        const createdTask = createdRes?.data || null;

        // Upload attachments (after we have task id)
        const files = Array.isArray(formData.attachments) ? formData.attachments : [];
        if (createdTask?.id && files.length > 0) {
          try {
            await uploadAttachments({
              files,
              entityType: "task",
              entityId: createdTask.id,
            });
          } catch (e) {
            // non-blocking: task is created, attachments failed
            console.error("Failed to upload task attachments:", e);
          }
        }

        navigate(returnTo || `/organisations/${id}/projects/${projectId}/tasks`);
      } catch (err) {
        console.error("Failed to create task:", err);
        setError(err?.message || "Failed to create task.");
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  const handleCancel = () => {
    navigate(returnTo || `/organisations/${id}/projects/${projectId}/tasks`);
  };

  return (
    <OrganisationLayout
      organisationName={breadcrumbLabel}
      pageTitle={headerTitle}
      primaryActionLabel="Create Task"
      onPrimaryAction={handleSubmit}
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
        Log a task to organize and prioritize work for{" "}
        <strong>{orgName || "Organisation"}</strong> / <strong>{projName || "Project"}</strong>.
      </p>

      <DashboardSectionCard title="">
        <form onSubmit={handleSubmit}>
          <TaskForm
            formData={formData}
            onFieldChange={handleFieldChange}
            memberOptions={memberOptions}
          />

          {error && (
            <div
              style={{
                marginTop: t.spacing(2),
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
            <PrimaryButton
              type="submit"
              fullWidth={false}
              disabled={isSubmitting}
              icon={
                <img
                  src={addIcon}
                  alt="Create task"
                  style={{ width: 18, height: 18 }}
                />
              }
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </PrimaryButton>
          </div>
        </form>
      </DashboardSectionCard>
    </OrganisationLayout>
  );
};

export default CreateTask;


