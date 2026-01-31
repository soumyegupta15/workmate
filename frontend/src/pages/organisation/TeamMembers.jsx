import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { OrganisationLayout } from "../../layouts";
import { TeamMemberCard, Loader } from "../../components";
import { useTheme } from "../../context/theme";
import RemoveMemberPopup from "./RemoveMemberPopup";
import InviteMemberPopup from "./InviteMemberPopup";
import {
  getOrganisationById,
  getOrganisationMembers,
  inviteOrganisationMembers,
} from "../../services/orgService";

const AVATAR_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#ef4444", "#6366f1"];
const toUiStatus = (value) => {
  const v = String(value || "").toLowerCase();
  if (!v) return "active";
  if (v.includes("active")) return "active";
  if (v.includes("pending")) return "pending";
  return "inactive";
};

const OrganisationTeamMembers = () => {
  const t = useTheme();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const organisationName = org?.org_name || "Organisation";

  const loadMembers = async () => {
    const orgId = id;
    if (!orgId) return;
    setIsLoading(true);
    setError("");
    try {
      const [orgRes, membersRes] = await Promise.all([
        getOrganisationById(orgId),
        getOrganisationMembers(orgId),
      ]);

      setOrg(orgRes?.data || null);

      const list = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const mapped = list
        .map((m, index) => {
          const user = m.user || {};
          const displayName =
            user.name || user.email || `User ${String(m.user_id || "").slice(0, 6)}`;
          return {
            id: m.id, // org_members row id (used for removal later if needed)
            name: displayName,
            role: m.is_admin ? "Admin" : "Member",
            activeProjects: Number(m?.active_projects ?? 0),
            status: toUiStatus(user.status),
            avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
            email: user.email || "",
            userId: m.user_id,
          };
        })
        .filter(Boolean);
      setMembers(mapped);
    } catch (err) {
      console.error("Failed to load organisation members:", err);
      setError(err?.message || "Failed to load members.");
      setOrg(null);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => {
      const haystack = `${member.name} ${member.role}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery, members]);

  const handleRequestRemove = (member) => {
    setMemberToRemove(member);
  };

  const handleCancelRemove = () => {
    setMemberToRemove(null);
  };

  const handleConfirmRemove = () => {
    // TODO: Wire remove to backend (DELETE org-member) if desired.
    setMemberToRemove(null);
  };

  const handleOpenInvite = () => setIsInviteOpen(true);
  const handleCancelInvite = () => setIsInviteOpen(false);
  const handleConfirmInvite = async (emails) => {
    const list = Array.isArray(emails) ? emails : [emails].filter(Boolean);
    if (!id || list.length === 0) {
      setIsInviteOpen(false);
      return;
    }
    try {
      await inviteOrganisationMembers(id, list);
    setIsInviteOpen(false);
      await loadMembers();
    } catch (err) {
      console.error("Failed to invite members:", err);
      setError(err?.message || "Failed to invite members.");
    }
  };

  const renderMemberCard = (member) => {
    return (
      <TeamMemberCard
        key={member.id}
        member={member}
        onRemove={() => handleRequestRemove(member)}
      />
    );
  };

  return (
    <OrganisationLayout
      organisationName={organisationName}
      primaryActionLabel="+ Add Member"
      onPrimaryAction={handleOpenInvite}
      searchPlaceholder="Search team members..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {error && (
        <div
          style={{
            marginBottom: t.spacing(4),
            padding: t.spacing(2),
            borderRadius: t.radius.card,
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: t.spacing(4),
          alignItems: "stretch",
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
          filteredMembers.map((member) => renderMemberCard(member))
        )}
      </div>
      <RemoveMemberPopup
        isOpen={!!memberToRemove}
        onCancel={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        memberName={memberToRemove?.name}
      />
      <InviteMemberPopup
        isOpen={isInviteOpen}
        onCancel={handleCancelInvite}
        onConfirm={handleConfirmInvite}
      />
    </OrganisationLayout>
  );
};

export default OrganisationTeamMembers;
