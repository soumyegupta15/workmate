import React from "react";
import { Popup, CopyableRow } from "../../components";
import { useTheme } from "../../context/theme";

const AboutOrganisationPopup = ({
  isOpen,
  onClose,
  organisationName = "Quantum Solutions",
  descriptionHtml = "",
  email = "",
  contactNumber = "",
  address = "",
  error = "",
}) => {
  const t = useTheme();
  const hasDescription =
    typeof descriptionHtml === "string" &&
    descriptionHtml.trim() !== "" &&
    descriptionHtml.trim() !== "<p><br></p>";

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={`About ${organisationName}`}
      maxWidth="720px"
    >
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

        <h3
          style={{
            margin: 0,
            marginBottom: t.spacing(2),
            fontSize: t.font.size.md,
            fontWeight: t.font.weight.semiBold,
            color: t.colors.textHeadingDark,
          }}
        >
          Contact Info
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: t.spacing(1.5),
          }}
        >
          {email ? (
            <CopyableRow copyValue={email} icon="✉">
              {email}
          </CopyableRow>
          ) : null}

          {contactNumber ? (
            <CopyableRow copyValue={contactNumber} icon="☎">
              {contactNumber}
          </CopyableRow>
          ) : null}

          {address ? (
            <CopyableRow copyValue={address} icon="📍" align="flex-start">
              {address}
          </CopyableRow>
          ) : null}

          {!email && !contactNumber && !address ? (
            <div style={{ color: t.colors.textMutedDark }}>
              No contact info available.
            </div>
          ) : null}
        </div>
      </div>
    </Popup>
  );
};

export default AboutOrganisationPopup;
