import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeLayout } from "../../layouts";
import {
  PriorityFilterDropdown,
  SortFilterDropdown,
  TaskCard,
  Loader,
} from "../../components";
import { useTheme } from "../../context/theme";
import { useAuth } from "../../hooks/useAuth";
import { getProjectById, listMyProjects } from "../../services/projectService";
import { listMyTasks, updateTaskById } from "../../services/taskService";
import AboutProjectPopup from "../organisation/AboutProjectPopup";

const COLUMN_DEFS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "done", title: "Done" },
];

const columnIdToStatus = (columnId) => {
  const v = String(columnId || "").trim().toLowerCase();
  if (v === "todo") return "todo";
  if (v === "in-progress" || v === "in_progress") return "in_progress";
  if (v === "in-review" || v === "in_review") return "in_review";
  if (v === "done") return "done";
  return "todo";
};

const normalizeStatusToColumnId = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "todo";
  const norm = v.replace(/\s+/g, "_");
  if (norm === "to_do" || norm === "todo") return "todo";
  if (norm === "in_progress" || norm === "in-progress") return "in-progress";
  if (norm === "in_review") return "in-review";
  if (norm === "done") return "done";
  return "todo";
};

const priorityLabel = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  if (v === "urgent") return "High";
  return "Medium";
};

const initialsFrom = (nameOrEmail) => {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "";
  if (s.includes("@")) return s.slice(0, 2).toUpperCase();
  const parts = s.split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
};

const avatarColorFrom = (seed) => {
  const colors = ["#22c55e", "#f97316", "#3b82f6", "#ef4444", "#6366f1", "#10b981"];
  const str = String(seed || "");
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

const EmployeeDashboard = () => {
  const t = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(["High", "Medium", "Low"]);
  const [sortOption, setSortOption] = useState("due-desc");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [isUpdatingTaskId, setIsUpdatingTaskId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError("");
    (async () => {
      try {
        const res = await listMyProjects();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (cancelled) return;
        setProjects(list);
        setSelectedProject((prev) => {
          if (prev && list.some((p) => String(p?.id) === String(prev?.id))) return prev;
          return list[0] || null;
        });
      } catch (e) {
        if (!cancelled) {
          setProjects([]);
          setSelectedProject(null);
          setError(e?.message || "Failed to load projects.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pid = selectedProject?.id;
    if (!pid) return;
    let cancelled = false;

    setIsLoading(true);
    setError("");

    (async () => {
      try {
        const res = await listMyTasks({ projectId: pid });
        if (cancelled) return;
        setTasks(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load tasks.");
          setTasks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id]);

  useEffect(() => {
    const pid = selectedProject?.id;
    if (!pid) {
      setSelectedProjectDetails(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getProjectById(pid);
        if (!cancelled) setSelectedProjectDetails(res?.data || null);
      } catch {
        if (!cancelled) setSelectedProjectDetails(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id]);

  const filteredColumns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activePriorities =
      priorityFilter && priorityFilter.length ? priorityFilter : ["High", "Medium", "Low"];

    const sortByDueDate = (a, b) => {
      const aDate = new Date(a.due);
      const bDate = new Date(b.due);
      if (Number.isNaN(aDate) || Number.isNaN(bDate)) return 0;
      return sortOption === "due-asc" ? aDate - bDate : bDate - aDate;
    };

    const mapped = (tasks || []).map((task) => {
      const assignerName = task.assigner?.name || task.assigner?.email || "";
      return {
        id: task.id,
        priority: priorityLabel(task.priority),
        title: task.title,
        due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "",
        status: task.status || "To do",
        assignerName,
        assignerInitials: assignerName ? initialsFrom(assignerName) : "",
        avatarColor: avatarColorFrom(task.assigner_id || assignerName || task.id),
        raw: task,
      };
    });

    const filtered = mapped
      .filter((t) => (query ? `${t.title} ${t.priority}`.toLowerCase().includes(query) : true))
      .filter((t) => activePriorities.includes(t.priority));

    const grouped = new Map(COLUMN_DEFS.map((c) => [c.id, []]));
    for (const task of filtered) {
      const colId = normalizeStatusToColumnId(task.status);
      grouped.get(colId)?.push(task);
    }
    for (const [, list] of grouped) list.sort(sortByDueDate);

    return COLUMN_DEFS.map((c) => ({ ...c, tasks: grouped.get(c.id) || [] }));
  }, [priorityFilter, searchQuery, sortOption, tasks]);

  const handleTaskClick = (task) => {
    const orgId = selectedProject?.org_id;
    const projectId = selectedProject?.id;
    if (!orgId || !projectId) return;
    navigate(`/organisations/${orgId}/projects/${projectId}/tasks/${task.id}`, {
      state: { projectName: selectedProject?.name, task: task.raw },
    });
  };

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => {
        try {
          e.dataTransfer.setData("text/plain", String(task.id));
          e.dataTransfer.effectAllowed = "move";
        } catch {
          // ignore
        }
      }}
      style={{
        opacity: isUpdatingTaskId && String(isUpdatingTaskId) === String(task.id) ? 0.7 : 1,
        cursor: "grab",
      }}
      aria-label={`Task ${task.title}`}
    >
      <TaskCard
        priority={task.priority}
        title={task.title}
        dueDate={task.due}
        assigneeInitials={task.assignerInitials}
        avatarColor={task.avatarColor}
        onClick={() => handleTaskClick(task)}
      />
    </div>
  );

  const handleDropToColumn = async (columnId, draggedTaskId) => {
    // Employees can only move tasks to In Review. Admins can move anywhere.
    if (!isAdmin) {
      const target = String(columnId || "").trim().toLowerCase();
      const isInReview = target === "in-review" || target === "in_review";
      if (!isInReview) {
        setError("You can only move tasks to In Review. Only admin can move tasks to Done.");
        return;
      }
    }
    const status = columnIdToStatus(columnId);
    if (!draggedTaskId) return;

    const prevTasks = tasks;
    const idx = (tasks || []).findIndex((t) => String(t?.id) === String(draggedTaskId));
    if (idx < 0) return;

    const current = tasks[idx];
    if (String(current?.status || "").toLowerCase() === status) return;

    setError("");
    setIsUpdatingTaskId(draggedTaskId);

    const next = [...tasks];
    next[idx] = { ...current, status };
    setTasks(next);

    try {
      const res = await updateTaskById(draggedTaskId, { status });
      const updated = res?.data || null;
      if (updated) {
        setTasks((cur) =>
          (cur || []).map((t) => (String(t?.id) === String(draggedTaskId) ? { ...t, ...updated } : t))
        );
      }
    } catch (e) {
      setTasks(prevTasks);
      setError(e?.message || "Failed to update task status.");
    } finally {
      setIsUpdatingTaskId(null);
    }
  };

  const pageTitle = selectedProject?.name
    ? `My Tasks · ${selectedProject.name}`
    : "My Tasks";

  const projectDescriptionHtml = useMemo(() => {
    const p = selectedProjectDetails;
    return typeof p?.description === "string"
      ? p.description
      : typeof p?.about === "string"
      ? p.about
      : "";
  }, [selectedProjectDetails]);

  const hasProjectAbout =
    typeof projectDescriptionHtml === "string" &&
    projectDescriptionHtml.trim() !== "" &&
    projectDescriptionHtml.trim() !== "<p><br></p>";

  return (
    <EmployeeLayout
      pageTitle={pageTitle}
      searchPlaceholder="Search tasks..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      projects={projects}
      selectedProjectId={selectedProject?.id}
      onSelectProject={setSelectedProject}
    >
      {/* Project overview (About) */}
      <div style={{ marginBottom: t.spacing(4) }}>
        <div
          style={{
            backgroundColor: t.colors.cardBackground,
            borderRadius: "18px",
            padding: t.spacing(4),
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
            border: `1px solid ${t.colors.cardBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: t.spacing(3),
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: t.font.size.lg,
                fontWeight: t.font.weight.semiBold,
                color: t.colors.textHeadingDark,
              }}
            >
              About {selectedProject?.name || "Project"}
            </h3>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              style={{
                border: "none",
                background: "none",
                color: t.colors.link,
                fontSize: t.font.size.sm,
                fontWeight: t.font.weight.semiBold,
                cursor: "pointer",
              }}
            >
              Read More...
            </button>
          </div>

          {hasProjectAbout ? (
            <div
              style={{
                margin: 0,
                color: t.colors.textBodyDark,
                lineHeight: 1.6,
                fontSize: t.font.size.md,
                maxHeight: "110px",
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: projectDescriptionHtml }}
            />
          ) : (
            <p style={{ margin: 0, color: t.colors.textMutedDark }}>
              No description provided.
            </p>
          )}
        </div>
      </div>

      {error ? (
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
      ) : null}

      <div
        style={{
          display: "flex",
          gap: t.spacing(3),
          marginTop: t.spacing(3),
          marginBottom: t.spacing(4),
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <PriorityFilterDropdown selected={priorityFilter} onChange={setPriorityFilter} />
        <SortFilterDropdown value={sortOption} onChange={setSortOption} />
        <button
          type="button"
          onClick={() => {
            setPriorityFilter(["High", "Medium", "Low"]);
            setSortOption("due-desc");
            setSearchQuery("");
          }}
          style={{
            marginLeft: "auto",
            padding: `${t.spacing(1.5)} ${t.spacing(3)}`,
            borderRadius: "999px",
            border: "none",
            backgroundColor: "transparent",
            color: t.colors.link,
            fontSize: t.font.size.sm,
            fontWeight: t.font.weight.medium,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Clear all
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
              gridColumn: "1 / -1",
            }}
          >
            <Loader size={48} />
          </div>
        ) : (
          filteredColumns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isAdmin) {
                  const target = String(column.id || "").trim().toLowerCase();
                  const isInReview = target === "in-review" || target === "in_review";
                  if (!isInReview) return;
                }
                setDragOverColumnId(column.id);
              }}
              onDragLeave={() => setDragOverColumnId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumnId(null);
                const draggedTaskId = e.dataTransfer.getData("text/plain");
                handleDropToColumn(column.id, draggedTaskId);
              }}
              style={{
                backgroundColor: t.colors.taskSectionBackground,
                borderRadius: "18px",
                padding: t.spacing(3),
                minHeight: "480px",
                display: "flex",
                flexDirection: "column",
                gap: t.spacing(3),
                outline:
                  dragOverColumnId && String(dragOverColumnId) === String(column.id)
                    ? `2px dashed ${t.colors.primary}`
                    : "none",
                outlineOffset: 4,
              }}
            >
              <div
                style={{
                  fontSize: t.font.size.md,
                  fontWeight: t.font.weight.semiBold,
                  color: t.colors.textHeadingDark,
                }}
              >
                {column.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: t.spacing(3) }}>
                {column.tasks.map((task) => renderTaskCard(task))}
              </div>
            </div>
          ))
        )}
      </div>

      <AboutProjectPopup
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        projectName={selectedProject?.name || "Project"}
        descriptionHtml={projectDescriptionHtml || ""}
        attachments={
          Array.isArray(selectedProjectDetails?.attachments)
            ? selectedProjectDetails.attachments
            : []
        }
        error=""
      />
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;


