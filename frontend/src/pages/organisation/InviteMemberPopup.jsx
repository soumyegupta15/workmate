import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../context/theme";
import { searchUsersByEmail } from "../../services/userService";

const isValidEmail = (value) => {
  const v = String(value || "").trim();
  if (!v) return false;
  // Simple, pragmatic validation for UI gating.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const InviteMemberPopup = ({ isOpen, onCancel, onConfirm }) => {
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const latestReqId = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setSuggestions([]);
      setSelectedEmails([]);
      setIsSearching(false);
      setSearchError("");
    }
  }, [isOpen]);

  const canInvite = useMemo(() => isValidEmail(email), [email]);

  useEffect(() => {
    if (!isOpen) return;
    const q = String(email || "").trim();

    // avoid spamming API on very short input
    if (q.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    const reqId = ++latestReqId.current;
    setIsSearching(true);
    setSearchError("");

    const handle = setTimeout(async () => {
      try {
        const res = await searchUsersByEmail(q, { limit: 8 });
        if (latestReqId.current !== reqId) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setSuggestions(list);
      } catch (err) {
        if (latestReqId.current !== reqId) return;
        setSuggestions([]);
        setSearchError(err?.message || "Failed to search users.");
      } finally {
        if (latestReqId.current === reqId) setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [email, isOpen]);

  const exactUserExists = useMemo(() => {
    const q = String(email || "").trim().toLowerCase();
    if (!q) return false;
    return (suggestions || []).some(
      (u) => String(u?.email || "").toLowerCase() === q
    );
  }, [email, suggestions]);

  const showNoUserForExactEmail = canInvite && !isSearching && !exactUserExists;
  const canConfirm = selectedEmails.length > 0;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        padding: t.spacing(5),
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: t.colors.primary,
          borderRadius: "18px",
          padding: t.spacing(5),
          marginLeft: t.spacing(50),
          color: "#f9fafb",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: t.spacing(3),
            fontSize: t.font.size.lg,
            fontWeight: t.font.weight.regular,
            fontFamily: t.font.family,
          }}
        >
          Add Member
        </h3>

        <div style={{ marginBottom: t.spacing(2), position: "relative" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter the email ID"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Allow adding via typed email only if it matches a registered user
                const typed = String(email || "").trim();
                if (isValidEmail(typed) && exactUserExists) {
                  setSelectedEmails((prev) =>
                    prev.includes(typed) ? prev : [...prev, typed]
                  );
                  setEmail("");
                  setSuggestions([]);
                }
              }
            }}
            style={{
              width: "100%",
              padding: `${t.spacing(2.5)} ${t.spacing(3)}`,
              borderRadius: "8px",
              border: "1px solid rgba(148, 163, 184, 0.8)",
              backgroundColor: "transparent",
              color: "#f9fafb",
              fontFamily: t.font.family,
              fontSize: t.font.size.md,
              outline: "none",
            }}
          />

          {email.trim().length >= 2 && (suggestions.length > 0 || isSearching) && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                backgroundColor: "#0b1220",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                borderRadius: "12px",
                overflow: "hidden",
                maxHeight: "240px",
                overflowY: "auto",
                zIndex: 60,
              }}
            >
              {isSearching && (
                <div style={{ padding: t.spacing(3), color: "#cbd5e1" }}>
                  Searching...
                </div>
              )}
              {!isSearching &&
                suggestions.map((u) => (
                  <button
                    key={u.id || u.email}
                    type="button"
                    onClick={() => {
                      const selected = String(u.email || "").trim();
                      if (!selected) return;
                      setSelectedEmails((prev) =>
                        prev.includes(selected) ? prev : [...prev, selected]
                      );
                      setEmail("");
                      setSuggestions([]);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: t.spacing(3),
                      border: "none",
                      background: "transparent",
                      color: "#f9fafb",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: t.font.size.md }}>
                      {u.name ? u.name : "Registered user"}
                    </div>
                    <div style={{ fontSize: t.font.size.sm, color: "#94a3b8" }}>
                      {u.email}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {selectedEmails.length > 0 && (
          <div
            style={{
              marginBottom: t.spacing(3),
              display: "flex",
              flexWrap: "wrap",
              gap: t.spacing(1.5),
            }}
          >
            {selectedEmails.map((e) => (
              <div
                key={e}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: t.spacing(1),
                  padding: `${t.spacing(1)} ${t.spacing(2)}`,
                  borderRadius: "999px",
                  backgroundColor: "rgba(148, 163, 184, 0.16)",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  color: "#f9fafb",
                  fontSize: t.font.size.sm,
                }}
              >
                <span>{e}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEmails((prev) => prev.filter((x) => x !== e))
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: 1,
                  }}
                  aria-label={`Remove ${e}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {searchError && (
          <div
            style={{
              marginBottom: t.spacing(3),
              color: "#fecaca",
              fontSize: t.font.size.sm,
            }}
          >
            {searchError}
          </div>
        )}

        {showNoUserForExactEmail && (
          <div
            style={{
              marginBottom: t.spacing(3),
              color: "#fde68a",
              fontSize: t.font.size.sm,
            }}
          >
            No user exists with this email.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: t.spacing(4),
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "10px",
              border: "1px solid rgba(148, 163, 184, 0.8)",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              fontSize: t.font.size.md,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(selectedEmails)}
            style={{
              minWidth: 140,
              padding: `${t.spacing(2)} ${t.spacing(4)}`,
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#22c55e",
              color: "#052e16",
              fontSize: t.font.size.md,
              fontWeight: t.font.weight.semiBold,
              cursor: "pointer",
              opacity: canConfirm ? 1 : 0.7,
            }}
            disabled={!canConfirm}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberPopup;


