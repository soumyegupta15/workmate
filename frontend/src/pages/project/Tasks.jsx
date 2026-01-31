import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import {
  TaskCard,
  PriorityFilterDropdown,
  AssigneeFilterDropdown,
  SortFilterDropdown,
  Loader,
} from "../../components";
import { useTheme } from "../../context/theme";
import addIcon from "../../assets/icons/addIcon.png";
import { getOrganisationById } from "../../services/orgService";
import { getProjectById } from "../../services/projectService";
import { listTasks } from "../../services/taskService";
import { updateTaskById } from "../../services/taskService";

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
  // backend supports urgent; keep layout same by surfacing as High
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

const ProjectTasks = () => {
  const t = useTheme();
  const { id, projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(["High", "Medium", "Low"]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState([]);
  const [sortOption, setSortOption] = useState("due-desc");
  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [isUpdatingTaskId, setIsUpdatingTaskId] = useState(null);

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    if (!orgId || !pid) return;
    let cancelled = false;
    setIsLoading(true);
    setError("");

    (async () => {
      try {
        const [orgRes, projRes, taskRes] = await Promise.all([
          getOrganisationById(orgId),
          getProjectById(pid),
          listTasks({ projectId: pid }),
        ]);
        if (cancelled) return;

        setOrgName(orgRes?.data?.org_name || "");
        setProjName(projRes?.data?.name || "");

        const list = Array.isArray(taskRes?.data) ? taskRes.data : [];
        setTasks(list);
      } catch (e) {
        if (cancelled) return;
        console.error("Failed to load tasks:", e);
        setError(e?.message || "Failed to load tasks.");
        setTasks([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, projectId]);

  const headerTitle = `${orgName || "Organisation"} / ${projName || "Project"} /`;

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
      const assigneeName = task.assignee?.name || task.assignee?.email || "";
      return {
        id: task.id,
        priority: priorityLabel(task.priority),
        title: task.title,
        due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "",
        status: task.status || "To do",
        assigneeName,
        assigneeInitials: assigneeName ? initialsFrom(assigneeName) : "",
        avatarColor: avatarColorFrom(task.assignee_id || assigneeName || task.id),
        raw: task,
      };
    });

    const filtered = mapped
      .filter((t) => (query ? `${t.title} ${t.priority}`.toLowerCase().includes(query) : true))
      .filter((t) => activePriorities.includes(t.priority))
      .filter((t) => (assigneeFilter.length ? assigneeFilter.includes(t.assigneeName) : true));

    const grouped = new Map(COLUMN_DEFS.map((c) => [c.id, []]));
    for (const task of filtered) {
      const colId = normalizeStatusToColumnId(task.status);
      grouped.get(colId)?.push(task);
    }
    for (const [, list] of grouped) list.sort(sortByDueDate);

    return COLUMN_DEFS.map((c) => ({ ...c, tasks: grouped.get(c.id) || [] }));
  }, [assigneeFilter, priorityFilter, searchQuery, sortOption, tasks]);

  const assigneeOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        (tasks || [])
          .map((t) => t.assignee?.name || t.assignee?.email || "")
          .filter(Boolean)
      )
    );
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [tasks]);

  const handleTaskClick = (task) => {
    navigate(
      `/organisations/${id}/projects/${projectId}/tasks/${task.id}`,
      {
        state: {
          projectName: projName,
          task: task.raw,
        },
      }
    );
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "High":
        return {
          backgroundColor: "rgba(248, 113, 113, 0.15)",
          color: "#b91c1c",
        };
      case "Medium":
        return {
          backgroundColor: "rgba(234, 179, 8, 0.15)",
          color: "#92400e",
        };
      case "Low":
      default:
        return {
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          color: "#15803d",
        };
    }
  };

  const renderTaskCard = (task) => {
    return (
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
        assigneeInitials={task.assigneeInitials}
        avatarColor={task.avatarColor}
        onClick={() => handleTaskClick(task)}
      />
      </div>
    );
  };

  const handleDropToColumn = async (columnId, draggedTaskId) => {
    const status = columnIdToStatus(columnId);
    if (!draggedTaskId) return;

    const prevTasks = tasks;
    const idx = (tasks || []).findIndex((t) => String(t?.id) === String(draggedTaskId));
    if (idx < 0) return;

    const current = tasks[idx];
    if (String(current?.status || "").toLowerCase() === status) return;

    setError("");
    setIsUpdatingTaskId(draggedTaskId);

    // optimistic update
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

  const handleClearFilters = () => {
    setPriorityFilter(["High", "Medium", "Low"]);
    setAssigneeSearch("");
    setAssigneeFilter([]);
    setSortOption("due-desc");
    setSearchQuery("");
  };

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
          state: { projectName: projName, from: `${location.pathname}${location.search}` },
        })
      }
      searchPlaceholder="Search tasks..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
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
      {/* Filters row */}
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
        <PriorityFilterDropdown
          selected={priorityFilter}
          onChange={setPriorityFilter}
        />
        <AssigneeFilterDropdown
          search={assigneeSearch}
          selected={assigneeFilter}
          options={assigneeOptions}
          onSearchChange={setAssigneeSearch}
          onSelectedChange={setAssigneeFilter}
        />
        <SortFilterDropdown value={sortOption} onChange={setSortOption} />

        <button
          type="button"
          onClick={handleClearFilters}
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

      {/* Kanban columns */}
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: t.spacing(3),
              }}
            >
              {column.tasks.map((task) => renderTaskCard(task))}
            </div>
          </div>
        ))
        )}
      </div>
    </OrganisationLayout>
  );
};

export default ProjectTasks;
