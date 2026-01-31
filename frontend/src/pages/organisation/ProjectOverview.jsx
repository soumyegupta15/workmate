import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { StatsCard, DashboardSectionCard, Loader } from "../../components";
import { useTheme } from "../../context/theme";
import addIcon from "../../assets/icons/addIcon.png";
import AboutProjectPopup from "./AboutProjectPopup";
import { getOrganisationById } from "../../services/orgService";
import {
  getProjectById,
  getProjectTaskStats,
  getProjectTeamStats,
} from "../../services/projectService";

const ProjectOverview = () => {
  const t = useTheme();
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [orgName, setOrgName] = useState("Organisation");
  const [project, setProject] = useState(null);
  const [projectError, setProjectError] = useState("");
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    progressPercent: null,
    total: null,
    completed: null,
    pending: null,
  });
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (!id || !projectId) return;
    let cancelled = false;
    setProjectError("");
    setIsLoading(true);
    (async () => {
      try {
        // Load project first to get name quickly, then load other data in parallel
        const [orgRes, projRes] = await Promise.all([
          getOrganisationById(id),
          getProjectById(projectId).catch((e) => {
            // If the project was deleted, navigate back to projects list to avoid repeated 404 spam.
            if (String(e?.message || "").toLowerCase().includes("project not found")) {
              navigate(`/organisations/${id}/projects`, { replace: true });
              return null;
            }
            throw e;
          }),
        ]);
        if (cancelled) return;
        if (!projRes) return; // Already navigated away

        setOrgName(orgRes?.data?.org_name || "Organisation");
        setProject(projRes?.data || null);

        // Load stats and team in parallel
        const [statsRes, teamRes] = await Promise.all([
          getProjectTaskStats(projectId),
          getProjectTeamStats(projectId),
        ]);
        if (cancelled) return;

        setStatsData({
          progressPercent: Number(statsRes?.data?.progressPercent ?? 0),
          total: Number(statsRes?.data?.total ?? 0),
          completed: Number(statsRes?.data?.completed ?? 0),
          pending: Number(statsRes?.data?.pending ?? 0),
        });

        const rows = Array.isArray(teamRes?.data) ? teamRes.data : [];
        const roleLabel = (r) => {
          const s = String(r || "")
            .trim()
            .toLowerCase();
          if (s === "owner") return "Owner";
          if (s === "manager") return "Manager";
          if (s === "viewer") return "Viewer";
          if (s === "member") return "Member";
          return r ? String(r) : "Member";
        };
        const mapped = rows.map((r) => {
          const u = r?.user || {};
          return {
            key: r?.id || u?.id || u?.email,
            name: u?.name || u?.email || "Member",
            role: roleLabel(r?.role),
            contribution: Number(r?.contributionPercent ?? 0),
            assignedCount: Number(r?.assignedCount ?? 0),
          };
        });
        setTeamMembers(mapped);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.message || "").toLowerCase().includes("project not found")) {
          navigate(`/organisations/${id}/projects`, { replace: true });
          return;
        }
        setOrgName("Organisation");
        setProject(null);
        setProjectError(e?.message || "Failed to load project.");
        setStatsData({
          progressPercent: null,
          total: null,
          completed: null,
          pending: null,
        });
        setTeamMembers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, projectId, navigate]);

  const projectNameFromState = location.state?.projectName;
  const projectName =
    project?.name || projectNameFromState || (isLoading ? "Loading..." : "Project");

  const headerTitle = `${orgName || "Organisation"} / ${
    projectName || "Project"
  } /`;

  const descriptionHtml = useMemo(() => {
    const d =
      typeof project?.description === "string"
        ? project.description
        : typeof project?.about === "string"
        ? project.about
        : "";
    return d;
  }, [project]);

  const hasAbout =
    typeof descriptionHtml === "string" &&
    descriptionHtml.trim() !== "" &&
    descriptionHtml.trim() !== "<p><br></p>";

  const overallProgressValue =
    typeof location.state?.overallProgress === "number"
      ? location.state.overallProgress
      : 75;

  const stats = [
    {
      label: "Overall Progress",
      value: `${statsData.progressPercent ?? overallProgressValue}%`,
      delta: null,
      progress: statsData.progressPercent ?? overallProgressValue,
    },
    {
      label: "Total Tasks",
      value: statsData.total ?? "—",
      delta: "+ 12 this week",
    },
    {
      label: "Tasks Completed",
      value: statsData.completed ?? "—",
      delta: "+ 8 this week",
    },
    {
      label: "Tasks Pending",
      value: statsData.pending ?? "—",
      delta: null,
    },
  ];

  const activityFeed = [
    {
      id: 1,
      description: "Saddie Adler completed task API integration.",
      time: "2 hours ago",
    },
    {
      id: 2,
      description: "Arthur Morgan commented on the task Website Redesign.",
      time: "8 hours ago",
    },
    {
      id: 3,
      description: "Jane Doe was added to the project.",
      time: "1 day ago",
    },
    {
      id: 4,
      description: "Mike Ross uploaded a new file to Model Training.",
      time: "2 days ago",
    },
  ];

  return (
    <OrganisationLayout
      organisationName={headerTitle}
      primaryActionLabel="Create Task"
      primaryActionIcon={
        <img
          src={addIcon}
          alt="Create task"
          style={{ width: 16, height: 16 }}
        />
      }
      onPrimaryAction={() =>
        navigate(`/organisations/${id}/projects/${projectId}/tasks/create`, {
          state: {
            projectName,
            from: `${location.pathname}${location.search}`,
          },
        })
      }
      searchPlaceholder="Search tasks..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: t.spacing(4),
        }}
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
          <>
            {/* Top Stats Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: t.spacing(4),
              }}
            >
              {stats.map((stat) => (
                <StatsCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.delta}
                  progress={stat.progress}
                />
              ))}
            </div>

        {/* About Project (rich text preview like org overview) */}
        <DashboardSectionCard
          title={`About ${projectName || "Project"}`}
          actionLabel="Read More..."
          onAction={() => setIsAboutPopupOpen(true)}
          actionPlacement="bottom-right"
        >
          {projectError && (
            <div
              style={{
                padding: t.spacing(2),
                borderRadius: t.radius.card,
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                marginBottom: t.spacing(2),
              }}
            >
              {projectError}
            </div>
          )}

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
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
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

        {/* Bottom Content Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
            gap: t.spacing(4),
          }}
        >
          {/* Team Members */}
          <DashboardSectionCard title="Team Members">
            <style>{`
              .team-members-scroll::-webkit-scrollbar { width: 0px; height: 0px; }
              .team-members-scroll { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>
            <div
              className="team-members-scroll"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: t.spacing(3),
                maxHeight: 320,
                overflowY: "auto",
                paddingRight: 2,
              }}
            >
              {teamMembers.map((member) => (
                <div
                  key={member.key || member.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr) auto",
                    alignItems: "center",
                    columnGap: t.spacing(3),
                    rowGap: t.spacing(1),
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: t.font.size.md,
                        fontWeight: t.font.weight.semiBold,
                        color: t.colors.textHeadingDark,
                      }}
                    >
                      {member.name}
                    </div>
                    <div
                      style={{
                        fontSize: t.font.size.sm,
                        color: t.colors.textMutedDark,
                      }}
                    >
                      {member.role}
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "999px",
                      backgroundColor: t.colors.progressTrack,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${member.contribution}%`,
                        height: "100%",
                        backgroundColor: t.colors.progressBar,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: t.font.size.xs,
                      color: t.colors.textMutedDark,
                      textAlign: "right",
                      minWidth: "80px",
                    }}
                  >
                    Contribution: {member.contribution}%{" "}
                    {Number.isFinite(member.assignedCount)
                      ? `· ${member.assignedCount}`
                      : ""}
                  </div>
                </div>
              ))}
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
              {activityFeed.map((item) => (
                <div key={item.id}>
                  <div
                    style={{
                      fontSize: t.font.size.sm,
                      color: t.colors.textHeadingDark,
                      marginBottom: t.spacing(0.5),
                    }}
                  >
                    {item.description}
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
          </>
        )}

        <AboutProjectPopup
          isOpen={isAboutPopupOpen}
          onClose={() => setIsAboutPopupOpen(false)}
          projectName={projectName || "Project"}
          descriptionHtml={descriptionHtml || ""}
          attachments={
            Array.isArray(project?.attachments) ? project.attachments : []
          }
          error={projectError}
        />
      </div>
    </OrganisationLayout>
  );
};

export default ProjectOverview;
