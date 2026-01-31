import React from "react";
import { AttachmentList, Popup } from "../../components";
import { useTheme } from "../../context/theme";

const AboutProjectPopup = ({
  isOpen,
  onClose,
  projectName = "Project",
  descriptionHtml = "",
  attachments = [],
  error = "",
}) => {
  const t = useTheme();
  const hasDescription =
    typeof descriptionHtml === "string" &&
    descriptionHtml.trim() !== "" &&
    descriptionHtml.trim() !== "<p><br></p>";

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={`About ${projectName}`} maxWidth="720px">
      <div
        style={{
          color: t.colors.textBodyDark,
          fontSize: t.font.size.sm,
          lineHeight: 1.6,
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: t.spacing(3),
              padding: t.spacing(2),
              borderRadius: t.radius.card,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {hasDescription ? (
          <div
            style={{
              margin: 0,
              marginBottom: t.spacing(3),
            }}
            // Quill stores HTML; we render it as-is for rich text display.
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              marginBottom: t.spacing(3),
              color: t.colors.textMutedDark,
            }}
          >
            No description provided.
          </p>
        )}

        {Array.isArray(attachments) && attachments.length > 0 ? (
          <div style={{ marginTop: t.spacing(2) }}>
            <h3
              style={{
                margin: 0,
                marginBottom: t.spacing(2),
                fontSize: t.font.size.md,
                fontWeight: t.font.weight.semiBold,
                color: t.colors.textHeadingDark,
              }}
            >
              Attachments
            </h3>
            <AttachmentList attachments={attachments} />
          </div>
        ) : null}
      </div>
    </Popup>
  );
};

export default AboutProjectPopup;


