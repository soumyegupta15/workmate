import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import {
  DashboardSectionCard,
  PrimaryButton,
  ProjectForm,
} from "../../components";
import { useTheme } from "../../context/theme";
import addIcon from "../../assets/icons/addIcon.png";
import { createProject } from "../../services/projectService";
import { getOrganisationById, getOrganisationMembers } from "../../services/orgService";
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
  projectName: "",
  description: "",
  startDate: "",
  endDate: "",
  teamSearch: "",
  teamMembers: [],
  attachments: [],
};

const CreateProject = () => {
  const t = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from;
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState("Create Project");
  const [memberOptions, setMemberOptions] = useState([]);

  useEffect(() => {
    const orgId = id;
    if (!orgId) return;
    let cancelled = false;

    (async () => {
      try {
        const [orgRes, membersRes] = await Promise.all([
          getOrganisationById(orgId),
          getOrganisationMembers(orgId),
        ]);
        if (cancelled) return;

        setOrgName(orgRes?.data?.org_name || "Create Project");

        const list = Array.isArray(membersRes?.data) ? membersRes.data : [];
        const mapped = list
          .map((m) => {
            const u = m?.user || null;
            if (!u?.email) return null;
            return {
              id: u.id,
              email: u.email,
              name: u.name || "",
            };
          })
          .filter(Boolean);
        setMemberOptions(mapped);
      } catch (e) {
        if (!cancelled) {
          setOrgName("Create Project");
          setMemberOptions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
        // If React state didn't catch the last Quill change before submit, read from DOM.
        const editorHtml = readRichTextHtml("description");
        const descriptionHtml =
          typeof formData.description === "string" && formData.description.trim() !== ""
            ? formData.description
            : editorHtml;

        const payload = {
          orgId: id,
          name: formData.projectName,
          // Quill rich text HTML
          description: descriptionHtml,
          about: descriptionHtml,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          // Selected org members (emails) to be added to project_members
          teamMemberEmails: formData.teamMembers || [],
        };
        // eslint-disable-next-line no-console
        console.log("Create project payload:", payload);
        const createdRes = await createProject(payload);
        const createdProject = createdRes?.data || null;

        // Upload attachments (after we have project id)
        const files = Array.isArray(formData.attachments) ? formData.attachments : [];
        if (createdProject?.id && files.length > 0) {
          try {
            await uploadAttachments({
              files,
              entityType: "project",
              entityId: createdProject.id,
            });
          } catch (e) {
            // non-blocking: project is created, attachments failed
            // eslint-disable-next-line no-console
            console.error("Failed to upload project attachments:", e);
          }
        }

        navigate(returnTo || `/organisations/${id}/projects`);
      } catch (err) {
        console.error("Failed to create project:", err);
        setError(err?.message || "Failed to create project.");
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  const handleCancel = () => {
    navigate(returnTo || `/organisations/${id}/projects`);
  };

  return (
    <OrganisationLayout
      organisationName={orgName || "Create Project"}
      primaryActionLabel="Create Project"
      onPrimaryAction={handleSubmit}
    >
      <DashboardSectionCard title="New Project Details">
        <form onSubmit={handleSubmit}>
          <ProjectForm
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
                  alt="Create project"
                  style={{ width: 18, height: 18 }}
                />
              }
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </PrimaryButton>
          </div>
        </form>
      </DashboardSectionCard>
    </OrganisationLayout>
  );
};

export default CreateProject;



