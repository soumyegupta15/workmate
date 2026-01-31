import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/theme";
import uploadIcon from "../../assets/icons/upload.png";

const AttachmentUploader = ({ label, attachments, onChange }) => {
  const t = useTheme();
  const inputRef = useRef(null);

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

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const next = [...attachments, ...files];
    onChange?.(next);

    // reset input so selecting the same file again still triggers change
    event.target.value = "";
  };

  const handleRemove = (index) => {
    const next = attachments.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const handlePreview = (file) => {
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke the object URL after a short delay to free memory.
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to preview attachment:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: t.spacing(1),
      }}
    >
      {label && (
        <span
          style={{
            fontSize: t.font.size.sm,
            color: "#6b7280",
          }}
        >
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        style={{
          width: "30%",
          display: "flex",
          height: 50,
          marginBottom: 10,
          alignItems: "center",
          justifyContent: "center",
          padding: `${t.spacing(1)} ${t.spacing(3)}`,
          borderRadius: "10px",
          border: `1px dashed ${t.colors.cardBorder}`,
          backgroundColor: t.colors.cardBackground,
          cursor: "pointer",
          fontFamily: t.font.family,
          fontSize: t.font.size.sm,
          color: "#0088FF",
          gap: t.spacing(1),
        }}
      >
        <img
          src={uploadIcon}
          alt="Add attachment"
          style={{ width: 18, height: 18, objectFit: "contain" }}
        />
        <span>Add Attachment</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      {attachments && attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: t.spacing(2),
          }}
        >
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
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
                onClick={() => handlePreview(file)}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
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
                    {formatFileSize(file.size)}{" "}
                    {file.type ? `· ${file.type}` : ""}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                style={{
                  marginLeft: t.spacing(1),
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: t.font.size.xs,
                  color: t.colors.textMutedDark,
                }}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AttachmentUploader.propTypes = {
  label: PropTypes.string,
  attachments: PropTypes.arrayOf(PropTypes.instanceOf(File)),
  onChange: PropTypes.func,
};

AttachmentUploader.defaultProps = {
  label: "",
  attachments: [],
  onChange: undefined,
};

export default AttachmentUploader;
