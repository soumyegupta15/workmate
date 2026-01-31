import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { StatsCard, DashboardSectionCard, Loader } from "../../components";
import { useTheme } from "../../context/theme";
import addIcon from "../../assets/icons/addIcon.png";
import AboutOrganisationPopup from "./AboutOrganisationPopup";
import {
  getOrgMembersCount,
  getOrgProjectsCount,
  getOrgTasksCount,
  getOrganisationById,
  getOrganisationProjectsSummary,
} from "../../services/orgService";

const OrganisationOverview = () => {
  const t = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const [counts, setCounts] = useState({
    projects: null,
    members: null,
    tasks: null,
  });
  const [countsError, setCountsError] = useState("");
  const [org, setOrg] = useState(null);
  const [orgError, setOrgError] = useState("");
  const [topProjects, setTopProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const organisationName = org?.org_name || "Organisation";
  const hasAbout =
    typeof org?.about === "string" &&
    org.about.trim() !== "" &&
    org.about.trim() !== "<p><br></p>";

  useEffect(() => {
    const orgId = id;
    if (!orgId) return;

    let cancelled = false;
    setCountsError("");
    setOrgError("");
    setIsLoading(true);

    (async () => {
      try {
        const [orgRes, projectsRes, membersRes, tasksRes, projectsSummaryRes] = await Promise.all([
          getOrganisationById(orgId),
          getOrgProjectsCount(orgId),
          getOrgMembersCount(orgId),
          getOrgTasksCount(orgId),
          getOrganisationProjectsSummary(orgId, { limit: 5 }),
        ]);

        if (cancelled) return;

        setOrg(orgRes?.data || null);
        setTopProjects(Array.isArray(projectsSummaryRes?.data) ? projectsSummaryRes.data : []);
        setCounts({
          projects: Number(projectsRes?.data?.count ?? 0),
          members: Number(membersRes?.data?.count ?? 0),
          tasks: Number(tasksRes?.data?.count ?? 0),
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load organisation counts:", err);
        const msg = err?.message || "Failed to load organisation stats.";
        setCountsError(msg);
        setOrgError(msg);
        setCounts({ projects: null, members: null, tasks: null });
        setOrg(null);
        setTopProjects([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stats = useMemo(
    () => [
      { label: "Total Projects", value: counts.projects ?? "—" },
      { label: "Total Team Members", value: counts.members ?? "—" },
      { label: "Total Tasks", value: counts.tasks ?? "—" },
    ],
    [counts.members, counts.projects, counts.tasks]
  );

  const renderOverview = () => (
    <div
      style={{ display: "flex", flexDirection: "column", gap: t.spacing(4) }}
    >
      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: t.spacing(4),
        }}
      >
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>
      {countsError && (
        <div
          style={{
            padding: t.spacing(2),
            borderRadius: t.radius.card,
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
          }}
        >
          {countsError}
        </div>
      )}

      {/* About Section */}
      <DashboardSectionCard
        title={`About ${organisationName}`}
        actionLabel="Read More..."
        onAction={() => setIsAboutPopupOpen(true)}
        actionPlacement="bottom-right"
      >
        {hasAbout ? (
          <div
          style={{
            margin: 0,
            marginBottom: t.spacing(2),
            color: t.colors.textBodyDark,
            lineHeight: 1.6,
            fontSize: t.font.size.md,
              maxHeight: "110px",
              overflow: "hidden",
            }}
            // Quill stores HTML; we render it as-is for rich text preview.
            dangerouslySetInnerHTML={{ __html: org.about }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              marginBottom: t.spacing(2),
              color: t.colors.textMutedDark,
              lineHeight: 1.6,
              fontSize: t.font.size.md,
            }}
          >
            No description provided.
        </p>
        )}
      </DashboardSectionCard>

      {/* Bottom Row: Recent Projects & Activity Feed */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
          gap: t.spacing(4),
        }}
      >
        {/* Recent Projects */}
        <DashboardSectionCard
          title="Projects"
          actionLabel="View All"
          actionPlacement="header"
          actionPosition="right"
          onAction={() =>
            navigate(`/organisations/${id}/projects`, {
              state: { from: `${location.pathname}${location.search}` },
            })
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing(3),
            }}
          >
            {topProjects.length === 0 ? (
              <div style={{ color: t.colors.textMutedDark, fontSize: t.font.size.sm }}>
                No projects found.
              </div>
            ) : (
              topProjects.map((project) => {
                const total = Number(project?.total_tasks ?? 0);
                const completed = Number(project?.completed_tasks ?? 0);
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                const due = project?.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : "—";
                return (
                  <div key={project.id || project.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: t.spacing(1),
                    fontSize: t.font.size.sm,
                    color: t.colors.textBodyDark,
                  }}
                >
                  <span
                    style={{
                      fontWeight: t.font.weight.medium,
                      color: t.colors.textHeadingDark,
                    }}
                  >
                    {project.name}
                  </span>
                  <span>Due {due}</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "999px",
                    backgroundColor: t.colors.progressTrack,
                    overflow: "hidden",
                    marginBottom: t.spacing(0.5),
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      backgroundColor: t.colors.progressBar,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: t.font.size.xs,
                    color: t.colors.textMutedDark,
                  }}
                >
                  <span>
                    {completed}/{total} tasks
                  </span>
                  <button
                    type="button"
                    style={{
                      border: "none",
                      background: "none",
                      color: t.colors.accentBlue,
                      cursor: "pointer",
                      fontSize: t.font.size.xs,
                    }}
                    onClick={() =>
                      navigate(`/organisations/${id}/projects/${project.id}/overview`, {
                        state: { projectName: project.name },
                      })
                    }
                  >
                    View Details
                  </button>
                </div>
              </div>
                );
              })
            )}
          </div>
        </DashboardSectionCard>

        {/* Activity Feed */}
        <DashboardSectionCard
          title="Activity Feed"
          actionLabel="View All"
          onAction={() => {}}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing(2.5),
            }}
          >
            {[
              {
                user: "Alex Ray",
                action: "created a new task in API Integration.",
                time: "2 hours ago",
              },
              {
                user: "Project Horizon",
                action: "was marked as 30% done.",
                time: "3 hours ago",
              },
              {
                user: "Jane Doe",
                action: "was added to the team.",
                time: "1 day ago",
              },
              {
                user: "Mike Ross",
                action: "commented on a task in Model Training.",
                time: "2 days ago",
              },
            ].map((item) => (
              <div key={item.user + item.time}>
                <div
                  style={{
                    fontSize: t.font.size.sm,
                    color: t.colors.textHeadingDark,
                    marginBottom: t.spacing(0.5),
                  }}
                >
                  <strong>{item.user}</strong> {item.action}
                </div>
                <div
                  style={{
                    fontSize: t.font.size.xs,
                    color: t.colors.textMutedDark,
                  }}
                >
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>

      <AboutOrganisationPopup
        isOpen={isAboutPopupOpen}
        onClose={() => setIsAboutPopupOpen(false)}
        organisationName={organisationName}
        descriptionHtml={org?.about || ""}
        email={org?.email || ""}
        contactNumber={org?.phone || ""}
        address={[
          org?.address_line_1,
          org?.address_line_2,
          org?.city,
          org?.state,
          org?.postal_code,
          org?.country,
        ]
          .filter(Boolean)
          .join(", ")}
        error={orgError}
      />
    </div>
  );

  return (
    <OrganisationLayout
      organisationName={organisationName}
      primaryActionLabel="Create Project"
      primaryActionIcon={
        <img
          src={addIcon}
          alt="Create project"
          style={{ width: 16, height: 16 }}
        />
      }
      onPrimaryAction={() =>
        navigate(`/organisations/${id}/projects/create`, {
          state: { from: `${location.pathname}${location.search}` },
        })
      }
      searchPlaceholder="Search project, tasks, or members..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Loader size={48} />
        </div>
      ) : (
        renderOverview()
      )}
    </OrganisationLayout>
  );
};

export default OrganisationOverview;
