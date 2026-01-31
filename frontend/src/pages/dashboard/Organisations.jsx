import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts";
import {
  OrganisationCard,
  SearchBar,
  PrimaryButton,
  ProfileDropdown,
  Loader,
} from "../../components";
import { AIPrompt } from "../../components/forms";
import { useAuth } from "../../hooks";
import { useTheme } from "../../context/theme";
import { ROUTES } from "../../utils/constants";
import addIcon from "../../assets/icons/addIcon.png";
import sampleProfile from "../../assets/images/sampleProfile.png";
import {
  getOrganisations,
  getOrgProjectsCount,
  getOrgMembersCount,
  getOrgTasksCount,
} from "../../services/orgService";

const Organisations = () => {
  const t = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [organisations, setOrganisations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAIWidget, setShowAIWidget] = useState(true);

  useEffect(() => {
    const loadOrganisations = async () => {
      // Wait for auth to resolve so we have the login userId when available
      if (isAuthLoading) return;

      setIsLoading(true);
      setError("");
      try {
        const response = await getOrganisations();
        // Backend returns { data: [...] }
        const list = Array.isArray(response?.data) ? response.data : [];
        
        // Fetch counts for each organisation in parallel
        const organisationsWithCounts = await Promise.all(
          list.map(async (org) => {
            try {
              const [projectsRes, membersRes, tasksRes] = await Promise.all([
                getOrgProjectsCount(org.id).catch(() => ({ data: { count: 0 } })),
                getOrgMembersCount(org.id).catch(() => ({ data: { count: 0 } })),
                getOrgTasksCount(org.id).catch(() => ({ data: { count: 0 } })),
              ]);

              return {
                id: org.id,
                name: org.org_name,
                hasLogo: false,
                members: Number(membersRes?.data?.count ?? 0),
                projects: Number(projectsRes?.data?.count ?? 0),
                tasks: Number(tasksRes?.data?.count ?? 0),
              };
            } catch (err) {
              // If fetching counts fails for one org, continue with 0s
              console.error(`Failed to load counts for org ${org.id}:`, err);
              return {
                id: org.id,
                name: org.org_name,
                hasLogo: false,
                members: 0,
                projects: 0,
                tasks: 0,
              };
            }
          })
        );

        setOrganisations(organisationsWithCounts);
      } catch (err) {
        console.error("Failed to load organisations:", err);
        setError(err.message || "Failed to load organisations.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganisations();
  }, [isAuthLoading, user?.id]);

  const filteredOrganisations = organisations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout showSidebar={false}>
      <div
        style={{
          padding: t.spacing(6),
          minHeight: "100vh",
          backgroundColor: t.colors.secondary,
        }}
      >
        {/* Header with title and profile avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: t.spacing(4),
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: t.font.weight.bold,
              color: "#1f2937",
              fontFamily: t.font.heading, // Song Myung
            }}
          >
            All Organisations
          </h1>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "999px",
                border: "2px solid #d1d5db",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <img
                src={sampleProfile}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "contain",
                }}
              />
            </button>
            {isProfileOpen && (
              <ProfileDropdown onClose={() => setIsProfileOpen(false)} />
            )}
          </div>
        </div>

        {/* AI Prompt Widget */}
        {showAIWidget && (
          <div
            style={{
              marginBottom: t.spacing(4),
              padding: t.spacing(3),
              backgroundColor: t.colors.cardBackground || '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${t.colors.border || '#e5e7eb'}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: t.spacing(2),
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: t.font.weight.medium,
                  color: t.colors.textPrimary || '#111827',
                }}
              >
                AI Assistant
              </h3>
              <button
                type="button"
                onClick={() => setShowAIWidget(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#6b7280',
                  padding: 0,
                  width: '24px',
                  height: '24px',
                }}
              >
                ×
              </button>
            </div>
            <AIPrompt
              orgId={null}
              compact={true}
              onSuccess={(data) => {
                console.log('AI action executed:', data);
                // Optionally reload organisations
                if (data?.result?.action === 'create_project' || data?.result?.action === 'create_task') {
                  window.location.reload();
                }
              }}
              onError={(err) => {
                console.error('AI action failed:', err);
              }}
            />
          </div>
        )}

        {/* Search bar with Create Organisation button aligned to the right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: t.spacing(4),
            marginBottom: t.spacing(6),
          }}
        >
          <div style={{ flex: 1 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search organisations..."
            />
          </div>
          <PrimaryButton
            icon={
              <img
                src={addIcon}
                alt="Add organisation"
                style={{ width: 16, height: 16 }}
              />
            }
            onClick={() =>
              navigate(ROUTES.CREATE_ORGANISATION, {
                state: { from: `${location.pathname}${location.search}` },
              })
            }
          >
            Create Organisation
          </PrimaryButton>
        </div>

        {/* Organisations Grid */}
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
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Loader size={48} />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: t.spacing(4),
            }}
          >
            {filteredOrganisations.map((org) => (
              <OrganisationCard key={org.id} organisation={org} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Organisations;
