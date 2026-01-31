import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";
import fileIcon from "../../assets/icons/fileIcon.png";
import imageIcon from "../../assets/icons/imageIcon.png";
import downloadIcon from "../../assets/icons/download.png";

/**
 * Reusable read-only attachment list.
 * Mirrors the visual style of attachments in AttachmentUploader
 * but without upload / remove controls.
 */
const AttachmentList = ({ attachments }) => {
  const t = useTheme();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getIconForFile = (file) => {
    const name = (file?.name || "").toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
      return imageIcon;
    }
    return fileIcon;
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

  const handleOpen = (attachment) => {
    if (!attachment?.url) return;
    try {
      window.open(attachment.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to open attachment:", error);
    }
  };

  const handleDownload = (attachment) => {
    if (!attachment?.url) return;

    try {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to download attachment:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: t.spacing(2),
      }}
    >
      {attachments.map((file) => (
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
            onClick={() => handleOpen(file)}
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
                src={getIconForFile(file)}
                alt="Attachment"
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
                {formatFileSize(file.size)} {file.type ? `· ${file.type}` : ""}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDownload(file)}
            style={{
              marginLeft: t.spacing(1),
              border: "none",
              background: "none",
              cursor: file.url ? "pointer" : "default",
              fontSize: t.font.size.sm,
              color: t.colors.textMutedDark,
            }}
            aria-label={`Download ${file.name}`}
          >
            <img
              src={downloadIcon}
              alt="Download"
              style={{ width: 14, height: 14, objectFit: "contain" }}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
      size: PropTypes.number,
      type: PropTypes.string,
      url: PropTypes.string,
    })
  ),
};

AttachmentList.defaultProps = {
  attachments: [],
};

export default AttachmentList;


