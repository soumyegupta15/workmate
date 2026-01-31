import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { DashboardSectionCard } from "../../components";
import { useTheme } from "../../context/theme";
import { getOrganisationById } from "../../services/orgService";
import { getProjectById } from "../../services/projectService";

const ProjectNotifications = () => {
  const t = useTheme();
  const { id, projectId } = useParams();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState(location.state?.projectName || "");

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    if (!orgId || !pid) return;
    let cancelled = false;

    (async () => {
      try {
        const [orgRes, projRes] = await Promise.all([
          getOrganisationById(orgId),
          getProjectById(pid),
        ]);
        if (cancelled) return;
        setOrgName(orgRes?.data?.org_name || "");
        setProjName(projRes?.data?.name || "");
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, projectId]);

  const headerTitle = `${orgName || "Organisation"} / ${projName || "Project"} / Notifications`;

  return (
    <OrganisationLayout
      organisationName={headerTitle}
      searchPlaceholder="Search notifications..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <DashboardSectionCard title="Notifications">
        <p
          style={{
            margin: 0,
            color: t.colors.textBodyDark,
            fontSize: t.font.size.md,
          }}
        >
          This is a placeholder for project notifications. Show project-specific
          alerts, updates, and reminders here.
        </p>
      </DashboardSectionCard>
    </OrganisationLayout>
  );
};

export default ProjectNotifications;


