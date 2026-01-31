import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import {
  DashboardSectionCard,
  PrimaryButton,
  ProjectForm,
} from "../../components";
import { DangerZoneSection } from "../../components";
import { useTheme } from "../../context/theme";
import { getOrganisationById, getOrganisationMembers } from "../../services/orgService";
import { getProjectById, updateProjectById, deleteProjectById } from "../../services/projectService";
import { listProjectMembers, createProjectMember, deleteProjectMemberById } from "../../services/projectMemberService";
import { deleteAttachmentById, listAttachments, uploadAttachments } from "../../services/attachmentService";
import uploadIcon from "../../assets/icons/upload.png";

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

const normalizeRich = (v) => {
  if (v == null) return "";
  const s = String(v);
  const trimmed = s.trim();
  if (!trimmed || trimmed === "<p><br></p>") return "";
  return s;
};

const ProjectSettings = () => {
  const t = useTheme();
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    startDate: "",
    endDate: "",
    teamSearch: "",
    teamMembers: [],
    attachments: [],
  });
  const initialFormRef = useRef(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [projectMemberIdByEmail, setProjectMemberIdByEmail] = useState({});
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState(location.state?.projectName || "");

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    if (!orgId || !pid) return;
    let cancelled = false;
    setIsLoading(true);
    setError("");
    setSuccess("");

    (async () => {
      try {
        // Load core project details first so the form is never left blank if member endpoints fail.
        const orgRes = await getOrganisationById(orgId);
        if (cancelled) return;
        setOrgName(orgRes?.data?.org_name || "");

        let projRes;
        try {
          projRes = await getProjectById(pid);
        } catch (e) {
          if (String(e?.message || "").toLowerCase().includes("project not found")) {
            navigate(`/organisations/${orgId}/projects`, { replace: true });
            return;
          }
          throw e;
        }
        if (cancelled) return;
        const proj = projRes?.data || null;
        setProjName(proj?.name || "");

        const about =
          typeof proj?.description === "string"
            ? proj.description
            : typeof proj?.about === "string"
              ? proj.about
              : "";

        const nextForm = {
          projectName: proj?.name || "",
          description: about || "",
          startDate: proj?.start_date || "",
          endDate: proj?.end_date || "",
          teamSearch: "",
          teamMembers: [],
          attachments: [],
        };
        setFormData(nextForm);
        initialFormRef.current = nextForm;

        // Load attachments directly from attachments table (per requirement)
        try {
          const attRes = await listAttachments({ entityType: "project", entityId: pid });
          const rows = Array.isArray(attRes?.data) ? attRes.data : [];
          const mapped = rows.map((a) => ({
            id: a.id,
            name: a.file_name || "attachment",
            size: a.file_size ?? undefined,
            type: "",
            url: a.file_url || undefined,
          }));
          if (!cancelled) setExistingAttachments(mapped);
      } catch {
          // fallback to project endpoint attachments if list endpoint fails
          if (!cancelled) setExistingAttachments(Array.isArray(proj?.attachments) ? proj.attachments : []);
        }

        // Best-effort member data (do not block base form load)
        const [orgMembersRes, projectMembersRes] = await Promise.allSettled([
          getOrganisationMembers(orgId),
          listProjectMembers({ projectId: pid }),
        ]);
        if (cancelled) return;

        if (orgMembersRes.status === "fulfilled") {
          const orgMembers = Array.isArray(orgMembersRes.value?.data) ? orgMembersRes.value.data : [];
          const options = orgMembers
            .map((m) => m?.user)
            .filter((u) => u && u.email)
            .map((u) => ({ id: u.id, email: u.email, name: u.name }));
          setMemberOptions(options);
        } else {
          setMemberOptions([]);
        }

        if (projectMembersRes.status === "fulfilled") {
          const pmRows = Array.isArray(projectMembersRes.value?.data) ? projectMembersRes.value.data : [];
          const emails = pmRows
            .map((r) => r?.user?.email)
            .filter(Boolean)
            .map((e) => String(e).trim());
          const mapEmailToPmId = {};
          pmRows.forEach((r) => {
            const email = r?.user?.email;
            if (email) mapEmailToPmId[String(email).trim()] = r.id;
          });
          setProjectMemberIdByEmail(mapEmailToPmId);

          // Populate team members in both form and baseline
          setFormData((prev) => ({ ...prev, teamMembers: emails }));
          if (initialFormRef.current) {
            initialFormRef.current = { ...initialFormRef.current, teamMembers: emails };
          }
        } else {
          setProjectMemberIdByEmail({});
        }
      } catch (err) {
        if (cancelled) return;
        if (String(err?.message || "").toLowerCase().includes("project not found")) {
          navigate(`/organisations/${orgId}/projects`, { replace: true });
          return;
        }
        setError(err?.message || "Failed to load project.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, projectId]);

  const headerTitle = `${orgName || "Organisation"} / ${projName || "Project"} /`;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (event) => {
    if (event) {
      event.preventDefault();
    }
    const submit = async () => {
      if (!projectId) return;
      setIsSaving(true);
      setError("");
      setSuccess("");
      try {
        const editorHtml = readRichTextHtml("description");
        const descriptionHtml =
          // Prefer DOM-read Quill HTML to avoid missing the last keystroke before submit.
          editorHtml || (typeof formData.description === "string" ? formData.description : "");

        const payload = {
          name: formData.projectName,
          description: descriptionHtml,
          about: descriptionHtml,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        };

        const updatedRes = await updateProjectById(projectId, payload);
        const updatedProject = updatedRes?.data || null;

        // Sync team members (best-effort)
        const desired = Array.isArray(formData.teamMembers)
          ? formData.teamMembers.map((e) => String(e).trim()).filter(Boolean)
          : [];
        const currentEmails = Object.keys(projectMemberIdByEmail || {});

        const desiredSet = new Set(desired);
        const currentSet = new Set(currentEmails);

        const toAdd = desired.filter((e) => !currentSet.has(e));
        const toRemove = currentEmails.filter((e) => !desiredSet.has(e));

        // add: map email -> userId from memberOptions
        for (const email of toAdd) {
          const user = (memberOptions || []).find(
            (u) => String(u.email || "").trim().toLowerCase() === String(email).toLowerCase()
          );
          if (!user?.id) continue;
          try {
            await createProjectMember({ projectId, userId: user.id });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to add project member:", e);
          }
        }

        // remove: by projectMember id mapping
        for (const email of toRemove) {
          const pmId = projectMemberIdByEmail?.[email];
          if (!pmId) continue;
          try {
            await deleteProjectMemberById(pmId);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to remove project member:", e);
          }
        }

        // Upload new attachments
        const files = Array.isArray(formData.attachments) ? formData.attachments : [];
        if (files.length > 0) {
          try {
            await uploadAttachments({ files, entityType: "project", entityId: projectId });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload project attachments:", e);
          }
        }

        // Refresh project + members after save
        const [freshProjRes, freshMembersRes] = await Promise.all([
          getProjectById(projectId),
          listProjectMembers({ projectId }),
        ]);
        const freshProj = freshProjRes?.data || updatedProject || null;
        const pmRows = Array.isArray(freshMembersRes?.data) ? freshMembersRes.data : [];
        const emails = pmRows
          .map((r) => r?.user?.email)
          .filter(Boolean)
          .map((e) => String(e).trim());
        const mapEmailToPmId = {};
        pmRows.forEach((r) => {
          const email = r?.user?.email;
          if (email) mapEmailToPmId[String(email).trim()] = r.id;
        });
        setProjectMemberIdByEmail(mapEmailToPmId);
        setExistingAttachments(Array.isArray(freshProj?.attachments) ? freshProj.attachments : []);

        const about =
          typeof freshProj?.description === "string"
            ? freshProj.description
            : typeof freshProj?.about === "string"
              ? freshProj.about
              : "";

        const nextForm = {
          projectName: freshProj?.name || formData.projectName,
          description: about || descriptionHtml,
          startDate: freshProj?.start_date || formData.startDate || "",
          endDate: freshProj?.end_date || formData.endDate || "",
          teamSearch: "",
          teamMembers: emails,
          attachments: [],
        };
        setFormData(nextForm);
        initialFormRef.current = nextForm;

        setSuccess("Project updated successfully.");
      } catch (err) {
    // eslint-disable-next-line no-console
        console.error("Failed to update project:", err);
        setError(err?.message || "Failed to update project.");
      } finally {
        setIsSaving(false);
      }
    };
    submit();
  };

  const handleCancel = () => {
    if (initialFormRef.current) {
      setFormData(initialFormRef.current);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if (isDeletingProject) return;

    const ok = window.confirm(
      `Delete project "${projName || projectId}"?\n\nThis will delete tasks, comments, notifications, attachments, and files.`
    );
    if (!ok) return;

    setIsDeletingProject(true);
    setError("");
    setSuccess("");
    try {
      await deleteProjectById(projectId);
      navigate(`/organisations/${id}/projects`, { replace: true });
    } catch (e) {
      setError(e?.message || "Failed to delete project.");
      setIsDeletingProject(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== "number") return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const handleOpenExistingAttachment = (att) => {
    if (!att?.url) return;
    try {
      window.open(att.url, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  };

  const handleRemoveExistingAttachment = async (att) => {
    const attId = att?.id;
    if (!attId) return;
    if (deletingAttachmentId && String(deletingAttachmentId) === String(attId)) return;
    const ok = window.confirm(`Remove attachment "${att?.name || "attachment"}"?`);
    if (!ok) return;

    setDeletingAttachmentId(attId);
    setError("");
    setSuccess("");
    try {
      await deleteAttachmentById(attId);
      setExistingAttachments((prev) => (prev || []).filter((a) => String(a?.id) !== String(attId)));
      setSuccess("Attachment removed.");
    } catch (e) {
      setError(e?.message || "Failed to remove attachment.");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const isDirty = useMemo(() => {
    const base = initialFormRef.current;
    if (!base) return false;

    const compareKeys = ["projectName", "description", "startDate", "endDate"];
    for (const k of compareKeys) {
      const a = k === "description" ? normalizeRich(base[k]) : String(base[k] ?? "");
      const currentDesc =
        readRichTextHtml("description") ||
        (typeof formData.description === "string" ? formData.description : "");
      const b =
        k === "description" ? normalizeRich(currentDesc) : String(formData[k] ?? "");
      if (a !== b) return true;
    }

    const aMembers = Array.isArray(base.teamMembers) ? base.teamMembers.slice().sort() : [];
    const bMembers = Array.isArray(formData.teamMembers) ? formData.teamMembers.slice().sort() : [];
    if (aMembers.join("|") !== bMembers.join("|")) return true;

    const newFiles = Array.isArray(formData.attachments) ? formData.attachments : [];
    if (newFiles.length > 0) return true;

    return false;
  }, [formData]);

  const isSaveDisabled = isLoading || isSaving || !isDirty;

  return (
    <OrganisationLayout
      organisationName={headerTitle}
      primaryActionLabel="Save Changes"
      onPrimaryAction={handleSave}
      primaryActionDisabled={isSaveDisabled}
      searchPlaceholder="Search settings..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <DashboardSectionCard title="Project Settings">
        <form onSubmit={handleSave}>
          {error && (
            <div
              style={{
                marginBottom: t.spacing(4),
                padding: t.spacing(2),
                borderRadius: t.radius.card,
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                marginBottom: t.spacing(4),
                padding: t.spacing(2),
                borderRadius: t.radius.card,
                backgroundColor: "#dcfce7",
                color: "#166534",
              }}
            >
              {success}
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: t.spacing(2) }}>
                {existingAttachments.map((file) => (
                  <div
                    key={file.id || file.name}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: t.spacing(2),
                      borderRadius: "18px",
                      backgroundColor: t.colors.cardBackground,
                      border: `1px solid ${t.colors.cardBorder}`,
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
                      color: t.colors.textHeadingDark,
                      fontSize: t.font.size.sm,
                      maxWidth: 360,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenExistingAttachment(file)}
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        cursor: file.url ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        gap: t.spacing(2.5),
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "999px",
                          backgroundColor: "rgba(59, 130, 246, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={uploadIcon}
                          alt="File"
                          style={{ width: 20, height: 20, objectFit: "contain" }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          minWidth: 0,
                        }}
                      >
                        <span
                          title={file.name}
                          style={{
                            maxWidth: 230,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: t.font.weight.medium,
                          }}
                        >
                          {file.name}
                        </span>
                        <span
                          style={{
                            fontSize: t.font.size.xs,
                            color: t.colors.textMutedDark,
                          }}
                        >
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingAttachment(file)}
                      disabled={deletingAttachmentId && String(deletingAttachmentId) === String(file.id)}
                      style={{
                        marginLeft: t.spacing(1),
                        border: "none",
                        background: "none",
                        cursor:
                          deletingAttachmentId && String(deletingAttachmentId) === String(file.id)
                            ? "not-allowed"
                            : "pointer",
                        fontSize: t.font.size.xs,
                        color: t.colors.textMutedDark,
                        opacity:
                          deletingAttachmentId && String(deletingAttachmentId) === String(file.id)
                            ? 0.7
                            : 1,
                      }}
                      aria-label={`Remove ${file.name}`}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <ProjectForm
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
              disabled={isLoading || isSaving}
              style={{
                padding: `${t.spacing(2.5)} ${t.spacing(6)}`,
                borderRadius: t.radius.button,
                border: "1px solid #cbd5f5",
                backgroundColor: "#fff",
                color: "#111827",
                fontFamily: t.font.family,
                fontSize: t.font.size.md,
                cursor: isLoading || isSaving ? "not-allowed" : "pointer",
                opacity: isLoading || isSaving ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
            <PrimaryButton type="submit" fullWidth={false} disabled={isSaveDisabled}>
              {isSaving ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </DashboardSectionCard>

      <DangerZoneSection
        title="Delete this project"
        description="Once you delete a project, there is no going back. Please be certain."
        buttonLabel={isDeletingProject ? "Deleting..." : "Delete Project"}
        onButtonClick={handleDeleteProject}
        disabled={isDeletingProject || isLoading || isSaving}
      />
    </OrganisationLayout>
  );
};

export default ProjectSettings;
