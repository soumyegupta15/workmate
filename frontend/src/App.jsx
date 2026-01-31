import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OtpVerification from "./pages/auth/OtpVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Organisations from "./pages/dashboard/Organisations";
import CreateOrganisation from "./pages/dashboard/CreateOrganisation";
import EmployeeDashboard from "./pages/employee/Dashboard";
import OrganisationOverview from "./pages/organisation/Overview";
import OrganisationProjects from "./pages/organisation/Projects";
import CreateProject from "./pages/organisation/CreateProject";
import OrganisationTeamMembers from "./pages/organisation/TeamMembers";
import OrganisationSettings from "./pages/organisation/Settings";
import ProjectOverview from "./pages/organisation/ProjectOverview";
import ProjectTasks from "./pages/project/Tasks";
import ProjectNotifications from "./pages/project/Notifications";
import ProjectSettings from "./pages/project/Settings";
import CreateTask from "./pages/project/CreateTask";
import EditTask from "./pages/project/EditTask";
import TaskDetails from "./pages/project/TaskDetails";
import AIAssistant from "./pages/organisation/AIAssistant";
import { ROUTES } from "./utils/constants";
import { PrivateRoute } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Signup />} />
        <Route path={ROUTES.OTP_VERIFICATION} element={<OtpVerification />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Dashboard-level (protected) */}
        {/* Route /dashboard to Organisations now that standalone dashboard page is removed */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <PrivateRoute>
              <Organisations />
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.ORGANISATIONS}
          element={
            <PrivateRoute>
              <Organisations />
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CREATE_ORGANISATION}
          element={
            <PrivateRoute>
              <CreateOrganisation />
            </PrivateRoute>
          }
        />

        <Route
          path={ROUTES.EMPLOYEE_DASHBOARD}
          element={
            <PrivateRoute>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />

        {/* Organisation detail sub-pages (protected) */}
        <Route
          path="/organisations/:id/overview"
          element={
            <PrivateRoute>
              <OrganisationOverview />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects"
          element={
            <PrivateRoute>
              <OrganisationProjects />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/overview"
          element={
            <PrivateRoute>
              <ProjectOverview />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/tasks"
          element={
            <PrivateRoute>
              <ProjectTasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/tasks/:taskId"
          element={
            <PrivateRoute>
              <TaskDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/tasks/create"
          element={
            <PrivateRoute>
              <CreateTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/tasks/:taskId/edit"
          element={
            <PrivateRoute>
              <EditTask />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/notifications"
          element={
            <PrivateRoute>
              <ProjectNotifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/:projectId/settings"
          element={
            <PrivateRoute>
              <ProjectSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/projects/create"
          element={
            <PrivateRoute>
              <CreateProject />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/team"
          element={
            <PrivateRoute>
              <OrganisationTeamMembers />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/settings"
          element={
            <PrivateRoute>
              <OrganisationSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/organisations/:id/ai-assistant"
          element={
            <PrivateRoute>
              <AIAssistant />
            </PrivateRoute>
          }
        />

        {/* Redirect root and any unknown paths to login */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
