import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/theme";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../utils/constants";
import { sendChangePasswordOtp } from "../../services/authService";
import sampleProfile from "@assets/images/sampleProfile.png";
import editIcon from "@assets/icons/editIconBlack.png";

/**
 * Compact profile dropdown card shown from the header avatar.
 * Matches the dark profile card UI with avatar, name, email and actions.
 */
const ProfileDropdown = ({ onClose }) => {
  const t = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const displayName = user?.name || user?.fullName || "Jane Doe";
  const email = user?.email || "janedoe@gmail.com";

  const handleChangePassword = async () => {
    if (isSendingOtp) return;
    setIsSendingOtp(true);
    try {
      await sendChangePasswordOtp();
      navigate(`${ROUTES.OTP_VERIFICATION}?flow=change_password`);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
      if (onClose) onClose();
    }
  };

  const handleEditProfile = () => {
    navigate(ROUTES.PROFILE);
    if (onClose) onClose();
  };

  const handleSignOut = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "56px",
        right: 0,
        width: "350px",
        borderRadius: "20px",
        backgroundColor: t.colors.primary,
        color: "#F9FAFB",
        boxShadow: t.shadow.card,
        overflow: "hidden",
        zIndex: 40,
      }}
    >
      {/* Top section with avatar and user info */}
      <div
        style={{
          padding: t.spacing(5),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: t.spacing(3),
          backgroundColor: t.colors.primary,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "999px",
              backgroundColor: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #374151",
              overflow: "hidden",
            }}
          >
            <img
              src={sampleProfile}
              alt={displayName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleEditProfile}
            style={{
              position: "absolute",
              right: "-2px",
              bottom: "-2px",
              width: "28px",
              height: "28px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            <img
              src={editIcon}
              alt="Edit profile picture"
              style={{ width: "16px", height: "16px", objectFit: "contain" }}
            />
          </button>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              marginBottom: t.spacing(0.5),
              fontSize: "22px",
              fontWeight: t.font.weight.semiBold,
              fontFamily: t.font.heading,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: t.spacing(1),
            }}
          >
            <span>{displayName}</span>
            <button
              type="button"
              onClick={handleEditProfile}
              style={{
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={editIcon}
                alt="Edit name"
                style={{ width: "16px", height: "16px", objectFit: "contain" }}
              />
            </button>
          </div>
          <div
            style={{
              fontSize: t.font.size.sm,
              color: t.colors.subtleText,
              fontFamily: t.font.family,
            }}
          >
            {email}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div
        style={{
          display: "flex",
          backgroundColor: t.colors.primary,
          paddingBottom: t.spacing(4),
        }}
      >
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={isSendingOtp}
          style={{
            flex: 1,
            height: "50px",
            backgroundColor: "#465157",
            border: "none",
            color: "#F9FAFB",
            marginRight: "20px",
            fontSize: t.font.size.md,
            fontFamily: t.font.family,
            cursor: isSendingOtp ? "not-allowed" : "pointer",
            borderRadius: "0 25px 25px 0",
            opacity: isSendingOtp ? 0.8 : 1,
          }}
        >
          {isSendingOtp ? "Sending..." : "Change Password"}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            flex: 1,
            backgroundColor: "#465157",
            border: "none",
            height: "50px",
            color: "#F9FAFB",
            fontSize: t.font.size.md,
            fontFamily: t.font.family,
            cursor: "pointer",
            borderRadius: "25px 0 0 25px",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
