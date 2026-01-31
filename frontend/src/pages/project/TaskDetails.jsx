import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { AttachmentList, DashboardSectionCard, Loader } from "../../components";
import { useTheme } from "../../context/theme";
import editIconBlack from "../../assets/icons/editIconBlack.png";
import attachmentIcon from "../../assets/icons/attachment.png";
import fileIcon from "../../assets/icons/fileIcon.png";
import imageIcon from "../../assets/icons/imageIcon.png";
import downloadIcon from "../../assets/icons/download.png";
import { getOrganisationById } from "../../services/orgService";
import { getProjectById } from "../../services/projectService";
import { deleteTaskById, getTaskById, updateTaskById } from "../../services/taskService";
import { useAuth } from "../../hooks/useAuth";
import {
  createComment,
  listComments as listTaskComments,
  updateCommentById as updateCommentByIdApi,
} from "../../services/commentService";
import { uploadAttachments } from "../../services/attachmentService";

const STATUS_OPTIONS = ["To do", "In Progress", "In Review", "Done"];

const CommentComposer = ({
  t,
  attachmentIcon,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  attachments,
  onRemoveAttachment,
  onAddAttachmentClick,
  fileInputRef,
  onFilesSelected,
  placeholder = "Add a comment...",
  submitLabel = "Comment",
  openLocalAttachment,
  getCommentAttachmentIcon,
}) => (
  <form onSubmit={onSubmit}>
    <div
      style={{
        display: "flex",
        gap: t.spacing(3),
        marginBottom: t.spacing(3),
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "999px",
          backgroundColor: "#3b82f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: t.font.weight.semiBold,
          fontSize: t.font.size.sm,
          flexShrink: 0,
        }}
      >
        Y
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ position: "relative" }}>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              padding: t.spacing(3),
              paddingRight: t.spacing(8),
              borderRadius: "12px",
              border: `1px solid ${t.colors.blackBorder}`,
              backgroundColor: "transparent",
              fontFamily: t.font.family,
              fontSize: t.font.size.sm,
              color: t.colors.textBodyDark,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={onAddAttachmentClick}
            style={{
              position: "absolute",
              right: t.spacing(3),
              bottom: t.spacing(2.5),
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Add attachment"
          >
            <img
              src={attachmentIcon}
              alt="Attachment"
              style={{ width: 18, height: 18, objectFit: "contain" }}
            />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={onFilesSelected}
          />
        </div>

        {attachments && attachments.length > 0 && (
          <div
            style={{
              marginTop: t.spacing(2),
              display: "flex",
              flexWrap: "wrap",
              gap: t.spacing(1.5),
            }}
          >
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: `${t.spacing(1)} ${t.spacing(1.75)}`,
                  borderRadius: "999px",
                  backgroundColor: "transparent",
                  color: t.colors.textBodyDark,
                  fontSize: t.font.size.xs,
                  gap: t.spacing(1),
                  maxWidth: 260,
                }}
              >
                <button
                  type="button"
                  onClick={() => openLocalAttachment(file)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    margin: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: t.spacing(1),
                    cursor: "pointer",
                    maxWidth: "100%",
                  }}
                >
                  <img
                    src={getCommentAttachmentIcon(file)}
                    alt="Attachment"
                    style={{ width: 14, height: 14, objectFit: "contain" }}
                  />
                  <span
                    title={file.name}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(index)}
                  style={{
                    marginLeft: t.spacing(0.5),
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: t.font.size.xs,
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: t.spacing(2), display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={isSubmitting || !String(value || "").trim()}
            style={{
              padding: `${t.spacing(1.5)} ${t.spacing(3.5)}`,
              borderRadius: "999px",
              border: "none",
              backgroundColor: t.colors.buttonPrimary,
              color: t.colors.buttonText,
              fontSize: t.font.size.sm,
              fontWeight: t.font.weight.medium,
              cursor: isSubmitting || !String(value || "").trim() ? "not-allowed" : "pointer",
              opacity: isSubmitting || !String(value || "").trim() ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  </form>
);

const statusToApiValue = (label) => {
  const v = String(label || "").trim().toLowerCase();
  if (v === "to do" || v === "todo") return "todo";
  if (v === "in progress" || v === "in_progress") return "in_progress";
  if (v === "in review" || v === "in_review") return "in_review";
  if (v === "done") return "done";
  return v.replace(/\s+/g, "_");
};

const statusLabel = (value) => {
  const v = String(value || "").trim();
  if (!v) return "To do";
  const norm = v.toLowerCase().replace(/\s+/g, "_");
  if (norm === "todo" || norm === "to_do") return "To do";
  if (norm === "in_progress" || norm === "in-progress") return "In Progress";
  if (norm === "in_review") return "In Review";
  if (norm === "done") return "Done";
  // Already human readable? Use as-is
  return v;
};

const priorityLabel = (value) => {
  const v = String(value || "").trim();
  if (!v) return "Medium";
  const norm = v.toLowerCase();
  if (norm === "high") return "High";
  if (norm === "medium") return "Medium";
  if (norm === "low") return "Low";
  if (norm === "urgent") return "High";
  // If it is already "High"/"Medium"/"Low"
  const cap = v[0].toUpperCase() + v.slice(1).toLowerCase();
  return ["High", "Medium", "Low"].includes(cap) ? cap : "Medium";
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

const TaskDetails = () => {
  const t = useTheme();
  const { id, projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentAttachments, setCommentAttachments] = useState([]);
  const commentFileInputRef = useRef(null);
  const [activeReplyToId, setActiveReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const replyFileInputRef = useRef(null);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [submittingReplyToId, setSubmittingReplyToId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [updatingCommentId, setUpdatingCommentId] = useState(null);

  const [orgName, setOrgName] = useState("");
  const [projName, setProjName] = useState(location.state?.projectName || "");
  const projectNameFromState = location.state?.projectName;
  const taskFromState = location.state?.task;
  const [task, setTask] = useState(taskFromState || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  useEffect(() => {
    const orgId = id;
    const pid = projectId;
    const tid = taskId;
    if (!orgId || !pid || !tid) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError("");
        const [orgRes, projRes, taskRes] = await Promise.all([
          getOrganisationById(orgId),
          getProjectById(pid),
          getTaskById(tid),
        ]);
        if (cancelled) return;
        setOrgName(orgRes?.data?.org_name || "");
        setProjName(projRes?.data?.name || "");
        setTask(taskRes?.data || null);
      } catch {
        // ignore
        if (!cancelled) {
          setError("Failed to load task details.");
          setTask(taskFromState || null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, projectId, taskId, taskFromState]);

  const projectName = projectNameFromState || projName || projectId;
  const currentTask = task || taskFromState || {};
  const displayStatus = statusLabel(currentTask.status);
  const displayPriority = priorityLabel(currentTask.priority);
  const dueDateLabel = currentTask.due_date
    ? new Date(currentTask.due_date).toLocaleDateString()
    : currentTask.dueDate || "";
  const assigneeName =
    currentTask.assignee?.name || currentTask.assignee?.email || "Unassigned";
  const assigneeInitials = initialsFrom(assigneeName);
  const assigneeAvatarColor = avatarColorFrom(
    currentTask.assignee_id || assigneeName || currentTask.id || taskId
  );
  const descriptionHtml =
    typeof currentTask.description === "string" ? currentTask.description : "";
  const hasDescription =
    typeof descriptionHtml === "string" &&
    descriptionHtml.trim() !== "" &&
    descriptionHtml.trim() !== "<p><br></p>";

  const handleBack = useCallback(() => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
      return;
    }
    try {
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch {
      // ignore
    }
    navigate(`/organisations/${id}/projects/${projectId}/tasks`, {
      state: { projectName },
    });
  }, [id, location.state, navigate, projectId, projectName]);

  const breadcrumbText = useMemo(
    () => `${orgName || "Organisation"} / ${projectName || "Project"} /`,
    [orgName, projectName]
  );

  const breadcrumbLabel = useMemo(
    () => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: t.spacing(1.5) }}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          title="Back"
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            color: "inherit",
            fontSize: 18,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ←
        </button>
        <span>{breadcrumbText}</span>
      </span>
    ),
    [breadcrumbText, handleBack, t]
  );

  const handleStatusChange = async (nextLabel) => {
    const nextStatus = statusToApiValue(nextLabel);
    if (!taskId || !nextStatus) return;
    if (isUpdatingStatus) return;
    if (statusLabel(currentTask.status).toLowerCase() === String(nextLabel).toLowerCase()) return;

    const prev = currentTask;
    setIsUpdatingStatus(true);
    setError("");

    // Optimistic update
    setTask((t0) => ({ ...(t0 || {}), status: nextStatus }));
    try {
      const res = await updateTaskById(taskId, { status: nextStatus });
      setTask(res?.data || null);
    } catch (e) {
      // rollback
      setTask(prev || null);
      setError(e?.message || "Failed to update task status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    if (isDeletingTask) return;

    const ok = window.confirm("Delete this task? This will also delete its comments and attachments.");
    if (!ok) return;

    setIsDeletingTask(true);
    setError("");
    try {
      await deleteTaskById(taskId);
      handleBack();
    } catch (e) {
      setError(e?.message || "Failed to delete task.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const refreshComments = useCallback(async () => {
    if (!taskId) return;
    setIsCommentsLoading(true);
    setCommentsError("");
    try {
      const res = await listTaskComments({ taskId });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setComments(rows);
    } catch (e) {
      setCommentsError(e?.message || "Failed to load comments.");
      setComments([]);
    } finally {
      setIsCommentsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  const getCommentAttachmentIcon = (file) => {
    const name = (file?.name || "").toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
      return imageIcon;
    }
    return fileIcon;
  };

  const openLocalAttachment = (file) => {
    if (!file) return;

    // If attachment came from DB, it'll have a url
    if (file?.url) {
      try {
        window.open(file.url, "_blank", "noopener,noreferrer");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to open attachment:", error);
      }
      return;
    }

    // Otherwise treat as local File
    try {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to preview attachment:", error);
    }
  };

  const downloadLocalAttachment = (file) => {
    if (!file) return;

    // If attachment came from DB, it'll have a url
    if (file?.url) {
      try {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name || "attachment";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to download attachment:", error);
      }
      return;
    }

    // Otherwise treat as local File
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to download attachment:", error);
    }
  };

  const handleCommentAttachmentClick = () => {
    if (commentFileInputRef.current) {
      commentFileInputRef.current.click();
    }
  };

  const handleReplyAttachmentClick = () => {
    if (replyFileInputRef.current) {
      replyFileInputRef.current.click();
    }
  };

  const handleCommentFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setCommentAttachments((prev) => [...prev, ...files]);
    // reset input so selecting the same file again still triggers change
    // eslint-disable-next-line no-param-reassign
    event.target.value = "";
  };

  const handleReplyFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setReplyAttachments((prev) => [...prev, ...files]);
    // eslint-disable-next-line no-param-reassign
    event.target.value = "";
  };

  const handleAddComment = (event) => {
    if (event) {
      event.preventDefault();
    }
    const submit = async () => {
    const value = newComment.trim();
      if (!value) return;
      if (isSubmittingComment) return;
      setCommentsError("");
      setIsSubmittingComment(true);
      try {
        const files = Array.isArray(commentAttachments) ? commentAttachments : [];
        const created = await createComment({ taskId, content: value });
        const createdComment = created?.data || null;

        if (createdComment?.id && files.length > 0) {
          try {
            await uploadAttachments({
              files,
              entityType: "comment",
              entityId: createdComment.id,
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload comment attachments:", e);
          }
        }

    setNewComment("");
    setCommentAttachments([]);
        await refreshComments();
      } catch (e) {
        setCommentsError(e?.message || "Failed to add comment.");
      } finally {
        setIsSubmittingComment(false);
      }
    };

    submit();
  };

  const handleAddReply = (parentId) => (event) => {
    if (event) event.preventDefault();
    const submit = async () => {
      const value = replyText.trim();
      if (!value || !parentId) return;
      if (submittingReplyToId && String(submittingReplyToId) === String(parentId)) return;
      setCommentsError("");
      setSubmittingReplyToId(parentId);
      try {
        const files = Array.isArray(replyAttachments) ? replyAttachments : [];
        const created = await createComment({ taskId, content: value, parentCommentId: parentId });
        const createdReply = created?.data || null;

        if (createdReply?.id && files.length > 0) {
          try {
            await uploadAttachments({
              files,
              entityType: "comment",
              entityId: createdReply.id,
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload reply attachments:", e);
          }
        }

        setReplyText("");
        setReplyAttachments([]);
        setActiveReplyToId(null);
        await refreshComments();
      } catch (e) {
        setCommentsError(e?.message || "Failed to add reply.");
      } finally {
        setSubmittingReplyToId(null);
      }
    };
    submit();
  };

  const startEditComment = (comment) => {
    if (!comment?.id) return;
    setEditingCommentId(comment.id);
    setEditText(String(comment.content || ""));
    // Close any open reply box while editing for clarity
    setActiveReplyToId(null);
    setReplyText("");
    setReplyAttachments([]);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const saveEditComment = (commentId) => async (event) => {
    if (event) event.preventDefault();
    const content = String(editText || "").trim();
    if (!commentId || !content) return;
    if (updatingCommentId && String(updatingCommentId) === String(commentId)) return;

    setCommentsError("");
    setUpdatingCommentId(commentId);
    try {
      await updateCommentByIdApi(commentId, { content });
      cancelEditComment();
      await refreshComments();
    } catch (e) {
      setCommentsError(e?.message || "Failed to update comment.");
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const buildCommentTree = useCallback((rows) => {
    const list = Array.isArray(rows) ? rows : [];
    const byId = new Map();
    const roots = [];
    for (const c of list) {
      if (!c || !c.id) continue;
      byId.set(String(c.id), { ...c, children: [] });
    }
    for (const node of byId.values()) {
      const parentId = node.parent_comment_id ? String(node.parent_comment_id) : null;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, []);

  const commentThreads = useMemo(() => buildCommentTree(comments), [buildCommentTree, comments]);

  const formatTimestamp = (iso) => {
    const ts = Date.parse(String(iso || ""));
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "";
    }
  };

  const renderStatusChip = (statusOption) => {
    const isActive = statusOption.toLowerCase() === String(displayStatus || "").toLowerCase();
    const isDoneOption = String(statusOption || "").toLowerCase() === "done";
    const isRoleBlocked = !isAdmin && isDoneOption && !isActive;
    const disabled = isUpdatingStatus || isRoleBlocked;

    return (
      <button
        key={statusOption}
        type="button"
        onClick={() => handleStatusChange(statusOption)}
        disabled={disabled}
        style={{
          padding: `${t.spacing(1.5)} ${t.spacing(3)}`,
          borderRadius: "8px",
          border: isActive
            ? `1px solid ${t.colors.primary}`
            : `1px solid ${t.colors.cardBorder}`,
          backgroundColor: isActive
            ? "rgba(37, 99, 235, 0.06)"
            : t.colors.cardBackground,
          color: isActive ? t.colors.primary : t.colors.textBodyDark,
          fontSize: t.font.size.sm,
          fontFamily: t.font.family,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {statusOption}
      </button>
    );
  };

  const renderPriorityBadge = (value) => {
    let backgroundColor = "rgba(34, 197, 94, 0.15)";
    let textColor = "#15803d";

    if (value === "High") {
      backgroundColor = "rgba(248, 113, 113, 0.15)";
      textColor = "#b91c1c";
    } else if (value === "Medium") {
      backgroundColor = "rgba(234, 179, 8, 0.15)";
      textColor = "#92400e";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `${t.spacing(0.5)} ${t.spacing(2)}`,
          borderRadius: "999px",
          backgroundColor,
          color: textColor,
          fontSize: t.font.size.xs,
          fontWeight: t.font.weight.medium,
        }}
      >
        {value}
      </span>
    );
  };

  const renderComment = (comment, depth = 0) => {
    const authorName = comment?.author?.name || comment?.author?.email || "Unknown";
    const initials = initialsFrom(authorName) || "U";
    const timestamp = formatTimestamp(comment?.created_at || comment?.created_at_col);
    const isReplying = activeReplyToId && String(activeReplyToId) === String(comment?.id);
    const isReply = Boolean(comment?.parent_comment_id);
    const isSubmittingThisReply =
      submittingReplyToId && String(submittingReplyToId) === String(comment?.id);
    const isEditing = editingCommentId && String(editingCommentId) === String(comment?.id);
    const isUpdating = updatingCommentId && String(updatingCommentId) === String(comment?.id);

    return (
    <div
      key={comment.id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: t.spacing(3),
          marginLeft: depth ? t.spacing(6) : 0,
          paddingLeft: depth ? t.spacing(3) : 0,
          borderLeft: depth ? `2px solid ${t.colors.cardBorder}` : "none",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "999px",
          backgroundColor: avatarColorFrom(comment?.author_id || authorName || comment?.id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: t.font.weight.semiBold,
          fontSize: t.font.size.sm,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: t.spacing(1.5),
            marginBottom: t.spacing(1),
          }}
        >
          <span
            style={{
              fontWeight: t.font.weight.semiBold,
              fontSize: t.font.size.sm,
              color: t.colors.textHeadingDark,
            }}
          >
            {authorName}
          </span>
          <span
            style={{
              fontSize: t.font.size.xs,
              color: t.colors.textMutedDark,
            }}
          >
            {timestamp}
          </span>
        </div>
        {isEditing ? (
          <form onSubmit={saveEditComment(comment.id)} style={{ marginBottom: t.spacing(1) }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                padding: t.spacing(3),
                borderRadius: "12px",
                border: `1px solid ${t.colors.blackBorder}`,
                backgroundColor: "transparent",
                fontFamily: t.font.family,
                fontSize: t.font.size.sm,
                color: t.colors.textBodyDark,
                outline: "none",
              }}
            />
            <div
              style={{
                marginTop: t.spacing(2),
                display: "flex",
                justifyContent: "flex-end",
                gap: t.spacing(2),
              }}
            >
              <button
                type="button"
                onClick={cancelEditComment}
                disabled={Boolean(isUpdating)}
                style={{
                  border: `1px solid ${t.colors.cardBorder}`,
                  background: "#fff",
                  color: t.colors.textHeadingDark,
                  borderRadius: "999px",
                  padding: `${t.spacing(1.25)} ${t.spacing(3)}`,
                  cursor: Boolean(isUpdating) ? "not-allowed" : "pointer",
                  fontSize: t.font.size.sm,
                  opacity: Boolean(isUpdating) ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(isUpdating) || !String(editText || "").trim()}
                style={{
                  padding: `${t.spacing(1.25)} ${t.spacing(3)}`,
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: t.colors.buttonPrimary,
                  color: t.colors.buttonText,
                  fontSize: t.font.size.sm,
                  fontWeight: t.font.weight.medium,
                  cursor:
                    Boolean(isUpdating) || !String(editText || "").trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: Boolean(isUpdating) || !String(editText || "").trim() ? 0.7 : 1,
                }}
              >
                {Boolean(isUpdating) ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : comment.content ? (
          <p
            style={{
              margin: 0,
              marginBottom: t.spacing(1),
              fontSize: t.font.size.sm,
              color: t.colors.textBodyDark,
            }}
          >
            {comment.content}
          </p>
        ) : null}

        {comment.attachments && comment.attachments.length > 0 && (
          <div
            style={{
              marginBottom: t.spacing(1.5),
              display: "flex",
              flexWrap: "wrap",
              gap: t.spacing(1.5),
            }}
          >
            {comment.attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: `${t.spacing(1)} ${t.spacing(1.75)}`,
                  borderRadius: "999px",
                  backgroundColor: "transparent",
                  color: t.colors.textBodyDark,
                  fontSize: t.font.size.xs,
                  gap: t.spacing(1),
                  maxWidth: 260,
                }}
              >
                <button
                  type="button"
                  onClick={() => openLocalAttachment(file)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    margin: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: t.spacing(1),
                    cursor: "pointer",
                    maxWidth: "100%",
                  }}
                >
                  <img
                    src={getCommentAttachmentIcon(file)}
                    alt="Attachment"
                    style={{ width: 14, height: 14, objectFit: "contain" }}
                  />
                  <span
                    title={file.name}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadLocalAttachment(file)}
                  style={{
                    marginLeft: t.spacing(0.5),
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-label={`Download ${file.name}`}
                >
                  <img
                    src={downloadIcon}
                    alt="Download"
                    style={{ width: 12, height: 12, objectFit: "contain" }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: t.spacing(2) }}>
          {!isReply ? (
        <button
          type="button"
              onClick={() => {
                setActiveReplyToId(comment?.id || null);
                setReplyText("");
                setReplyAttachments([]);
                setEditingCommentId(null);
                setEditText("");
              }}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            fontSize: t.font.size.xs,
            color: t.colors.link,
            cursor: "pointer",
          }}
        >
          Reply
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => startEditComment(comment)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              fontSize: t.font.size.xs,
              color: t.colors.link,
              cursor: "pointer",
            }}
          >
            Edit
        </button>
        </div>

        {isReplying && (
          <div style={{ marginTop: t.spacing(2) }}>
            <CommentComposer
              t={t}
              attachmentIcon={attachmentIcon}
              value={replyText}
              onChange={setReplyText}
              onSubmit={handleAddReply(comment.id)}
              isSubmitting={Boolean(isSubmittingThisReply)}
              attachments={replyAttachments}
              onRemoveAttachment={(idx) =>
                setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))
              }
              onAddAttachmentClick={handleReplyAttachmentClick}
              fileInputRef={replyFileInputRef}
              onFilesSelected={handleReplyFilesSelected}
              placeholder="Write a reply..."
              submitLabel="Reply"
              openLocalAttachment={openLocalAttachment}
              getCommentAttachmentIcon={getCommentAttachmentIcon}
            />
          </div>
        )}
      </div>
    </div>
  );
  };

  return (
    <OrganisationLayout
      organisationName={breadcrumbLabel}
      pageTitle={currentTask.title || "Task Details"}
      showSidebar={false}
    >
      {error && (
        <div
          style={{
            marginBottom: t.spacing(3),
            padding: t.spacing(2),
            borderRadius: t.radius.card,
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            fontSize: t.font.size.sm,
          }}
        >
          {error}
        </div>
      )}

      {/* Status row */}
      <div
        style={{
          marginBottom: t.spacing(4),
          display: "flex",
          flexWrap: "wrap",
          gap: t.spacing(2),
        }}
      >
        {STATUS_OPTIONS.map((status) => renderStatusChip(status))}
      </div>

      {/* Top row: description + side card with equal height */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.2fr)",
          gap: t.spacing(4),
          alignItems: "stretch",
          marginBottom: t.spacing(4),
        }}
      >
        <DashboardSectionCard title="">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
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
                Description
              </h3>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/organisations/${id}/projects/${projectId}/tasks/${taskId}/edit`,
                      {
                        state: {
                          projectName,
                          task: currentTask,
                        },
                      }
                    )
                  }
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: t.spacing(1),
                    borderRadius: "999px",
                  }}
                >
                  <img
                    src={editIconBlack}
                    alt="Edit description"
                    style={{ width: 18, height: 18, display: "block" }}
                  />
                </button>
              ) : null}
            </div>
            {isLoading && !currentTask.title ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: 0,
                  marginBottom: t.spacing(4),
                  minHeight: "100px",
                }}
              >
                <Loader size={32} />
              </div>
            ) : hasDescription ? (
              <div
              style={{
                margin: 0,
                marginBottom: t.spacing(4),
                color: t.colors.textBodyDark,
                fontSize: t.font.size.sm,
                lineHeight: 1.6,
              }}
                // Quill stores HTML; we render it as-is for rich text display.
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p
                style={{
                  margin: 0,
                  marginBottom: t.spacing(4),
                  color: t.colors.textMutedDark,
                  fontSize: t.font.size.sm,
                  lineHeight: 1.6,
                }}
              >
                No description provided.
              </p>
            )}
            <div
              style={{
                marginBottom: t.spacing(4),
              }}
            >
              <h4
                style={{
                  margin: 0,
                  marginBottom: t.spacing(2),
                  fontSize: t.font.size.sm,
                  fontWeight: t.font.weight.semiBold,
                  color: t.colors.textHeadingDark,
                }}
              >
                Attachments
              </h4>
              <AttachmentList attachments={currentTask.attachments || []} />
            </div>
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={isDeletingTask}
                  style={{
                    padding: `${t.spacing(2)} ${t.spacing(4)}`,
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    fontSize: t.font.size.sm,
                    fontWeight: t.font.weight.medium,
                    cursor: isDeletingTask ? "not-allowed" : "pointer",
                    opacity: isDeletingTask ? 0.7 : 1,
                  }}
                >
                  {isDeletingTask ? "Deleting..." : "Delete Task"}
                </button>
              ) : null}
            </div>
          </div>
        </DashboardSectionCard>

        {/* Right side: Task meta (same height as description card) */}
        <DashboardSectionCard title="">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing(4),
              height: "100%",
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  marginBottom: t.spacing(2),
                  fontSize: t.font.size.sm,
                  fontWeight: t.font.weight.semiBold,
                  color: t.colors.textHeadingDark,
                }}
              >
                Assignee
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: t.spacing(2),
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "999px",
                    backgroundColor: assigneeAvatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontWeight: t.font.weight.semiBold,
                    fontSize: t.font.size.sm,
                  }}
                >
                  {assigneeInitials}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: t.font.size.sm,
                      fontWeight: t.font.weight.semiBold,
                      color: t.colors.textHeadingDark,
                    }}
                  >
                    {assigneeName}
                  </div>
                  <div
                    style={{
                      fontSize: t.font.size.xs,
                      color: t.colors.textMutedDark,
                    }}
                  >
                    {currentTask.assignee?.email || ""}
                  </div>
                </div>
              </div>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${t.colors.cardBorder}`,
                margin: 0,
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: t.spacing(2.5),
                fontSize: t.font.size.sm,
                color: t.colors.textBodyDark,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Due Date</span>
                <span
                  style={{
                    fontWeight: t.font.weight.semiBold,
                  }}
                >
                  {dueDateLabel || "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Priority</span>
                {renderPriorityBadge(displayPriority)}
              </div>
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      {/* Full-width activity section */}
      <DashboardSectionCard title="Activity">
        {commentsError && (
          <div
            style={{
              marginBottom: t.spacing(3),
              padding: t.spacing(2),
              borderRadius: t.radius.card,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
                fontSize: t.font.size.sm,
              }}
            >
            {commentsError}
            </div>
        )}

        <CommentComposer
          t={t}
          attachmentIcon={attachmentIcon}
                  value={newComment}
          onChange={setNewComment}
          onSubmit={handleAddComment}
          isSubmitting={isSubmittingComment}
          attachments={commentAttachments}
          onRemoveAttachment={(idx) =>
            setCommentAttachments((prev) => prev.filter((_, i) => i !== idx))
          }
          onAddAttachmentClick={handleCommentAttachmentClick}
          fileInputRef={commentFileInputRef}
          onFilesSelected={handleCommentFilesSelected}
                  placeholder="Add a comment..."
          submitLabel="Comment"
          openLocalAttachment={openLocalAttachment}
          getCommentAttachmentIcon={getCommentAttachmentIcon}
                />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
            gap: t.spacing(4),
                }}
              >
          {isCommentsLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100px",
              }}
            >
              <Loader size={32} />
            </div>
          ) : commentThreads.length === 0 ? (
            <div style={{ color: t.colors.textMutedDark, fontSize: t.font.size.sm }}>
              No comments yet.
                  </div>
          ) : (
            commentThreads.map((c) => (
              <div key={c.id}>
                {renderComment(c, 0)}
                {Array.isArray(c.children) && c.children.length > 0 ? (
                  <div style={{ marginTop: t.spacing(2), display: "flex", flexDirection: "column", gap: t.spacing(3) }}>
                    {c.children.map((child) => renderComment(child, 1))}
                </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </OrganisationLayout>
  );
};

export default TaskDetails;
