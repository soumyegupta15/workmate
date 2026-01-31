import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import {
  DashboardSectionCard,
  OrganisationForm,
  PrimaryButton,
} from "../../components";
import { DangerZoneSection } from "../../components";
import { useTheme } from "../../context/theme";
import DeleteOrganisationPopup from "./DeleteOrganisationPopup";
import {
  deleteOrganisationById,
  getOrganisationById,
  updateOrganisation,
} from "../../services/orgService";

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

const OrganisationSettings = () => {
  const t = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    organisationName: "",
    email: "",
    contactNumber: "",
    description: "",
    teamSize: "1 - 10",
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
  });
  const initialFormRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  const organisationName = formData.organisationName || "Organisation Settings";

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
      if (!id) return;
      setIsSaving(true);
      setError("");
      setSuccess("");
      try {
        // Ensure latest Quill HTML is used
        const editorHtml = readRichTextHtml("description");
        const descriptionHtml =
          typeof formData.description === "string" && formData.description.trim() !== ""
            ? formData.description
            : editorHtml;

        const payload = {
          organisationName: formData.organisationName,
          email: formData.email,
          contactNumber: formData.contactNumber,
          description: descriptionHtml,
          about: descriptionHtml,
          address: formData.address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
        };

        const res = await updateOrganisation(id, payload);
        const updated = res?.data || null;
        if (updated) {
          const nextForm = {
            organisationName: updated.org_name || "",
            email: updated.email || "",
            contactNumber: updated.phone || "",
            description: updated.about || "",
            teamSize: formData.teamSize, // not stored in backend currently
            address: updated.address_line_1 || "",
            country: updated.country || "",
            state: updated.state || "",
            city: updated.city || "",
            pincode: updated.postal_code || "",
          };
          setFormData(nextForm);
          initialFormRef.current = nextForm;
        } else {
          initialFormRef.current = formData;
        }
        setSuccess("Organisation updated successfully.");
      } catch (err) {
        console.error("Failed to update organisation:", err);
        setError(err?.message || "Failed to update organisation.");
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

  const handleOpenDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
  };

  const handleConfirmDelete = async (typedName) => {
    if (!id) return;
    const expected = String(organisationName || "").trim();
    const typed = String(typedName || "").trim();
    if (!expected || typed !== expected) {
      setError("Organisation name does not match.");
      return;
    }
    if (isDeletingOrg) return;

    setIsDeletingOrg(true);
    setError("");
    setSuccess("");
    try {
      await deleteOrganisationById(id);
      setIsDeleteOpen(false);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to delete organisation:", err);
      setError(err?.message || "Failed to delete organisation.");
    } finally {
      setIsDeletingOrg(false);
    }
  };

  useEffect(() => {
    const orgId = id;
    if (!orgId) return;

    let cancelled = false;
    setIsLoading(true);
    setError("");
    setSuccess("");

    (async () => {
      try {
        const res = await getOrganisationById(orgId);
        if (cancelled) return;
        const org = res?.data || {};
        const nextForm = {
          organisationName: org.org_name || "",
          email: org.email || "",
          contactNumber: org.phone || "",
          description: org.about || "",
          teamSize: "1 - 10",
          address: org.address_line_1 || "",
          country: org.country || "",
          state: org.state || "",
          city: org.city || "",
          pincode: org.postal_code || "",
        };
        setFormData(nextForm);
        initialFormRef.current = nextForm;
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load organisation settings:", err);
        setError(err?.message || "Failed to load organisation.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const normalizeRich = (v) => {
    if (v == null) return "";
    const s = String(v);
    const trimmed = s.trim();
    if (!trimmed || trimmed === "<p><br></p>") return "";
    return s;
  };

  const isDirty = useMemo(() => {
    const base = initialFormRef.current;
    if (!base) return false;

    const keys = Object.keys(base);
    for (const k of keys) {
      const a = k === "description" ? normalizeRich(base[k]) : String(base[k] ?? "");
      const b =
        k === "description" ? normalizeRich(formData[k]) : String(formData[k] ?? "");
      if (a !== b) return true;
    }
    return false;
  }, [formData]);

  const isSaveDisabled = isLoading || isSaving || !isDirty;

  return (
    <OrganisationLayout
      organisationName={organisationName}
      primaryActionLabel="Save Changes"
      onPrimaryAction={handleSubmit}
      primaryActionDisabled={isSaveDisabled}
      searchPlaceholder="Search settings..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <DashboardSectionCard title="Organisation Settings">
        <form onSubmit={handleSubmit}>
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

          <OrganisationForm
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          <div
            style={{
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
        title="Delete this organisation"
        description="Once you delete an organisation, there is no going back. Please be certain."
        buttonLabel="Delete Organisation"
        onButtonClick={handleOpenDelete}
      />

      <DeleteOrganisationPopup
        isOpen={isDeleteOpen}
        organisationName={organisationName}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingOrg}
      />
    </OrganisationLayout>
  );
};

export default OrganisationSettings;
