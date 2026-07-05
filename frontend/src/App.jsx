import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import CandidatesPage from './pages/CandidatesPage'
import CandidateDetailsPage from './pages/CandidateDetailsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import RecruiterJobsDashboard from './pages/RecruiterJobsDashboard'
import JobFormPage from './pages/JobFormPage'
import JobApplicantsPage from './pages/JobApplicantsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyProfilePage from './pages/CompanyProfilePage'
import CompanyBrandingPage from './pages/CompanyBrandingPage'
import CompanyJobsPage from './pages/CompanyJobsPage'
import CompanyAnalyticsPage from './pages/CompanyAnalyticsPage'
import OrgSettingsPage from './pages/OrgSettingsPage'
import RecruiterTeamPage from './pages/RecruiterTeamPage'
import CompanyDocumentsPage from './pages/CompanyDocumentsPage'
import CompanyAIMetricsPage from './pages/CompanyAIMetricsPage'
import SavedJobsPage from './pages/SavedJobsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import CandidateProfilePage from './pages/CandidateProfilePage'
import JobPortalPage from './pages/JobPortalPage'
import ResumeManagerPage from './pages/ResumeManagerPage'
import ApplicationTrackerPage from './pages/ApplicationTrackerPage'
import ApplicationDetailsPage from './pages/ApplicationDetailsPage'
import InterviewSchedulerPage from './pages/InterviewSchedulerPage'
import CandidateDashboardPage from './pages/CandidateDashboardPage'
import CandidateActivityPage from './pages/CandidateActivityPage'
import CandidateInsightsPage from './pages/CandidateInsightsPage'
import NotificationsPage from './pages/NotificationsPage'
import ApplyJobPage from './pages/ApplyJobPage'
import ApplicationSuccessPage from './pages/ApplicationSuccessPage'
import ProtectedRoute from './components/ProtectedRoute'
import InterviewPortal from './pages/InterviewPortal'
import SystemCheck from './pages/SystemCheck'
import InterviewRoom from './pages/InterviewRoom'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Portal Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Candidate Workspace Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <CandidateDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <CandidateProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <JobPortalPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apply/:jobId" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <ApplyJobPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/application-success" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <ApplicationSuccessPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/saved-jobs" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <SavedJobsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resume" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <ResumeManagerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <ApplicationTrackerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications/:id" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <ApplicationDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scheduler" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <InterviewSchedulerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/activity" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <CandidateActivityPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE']}>
              <CandidateInsightsPage />
            </ProtectedRoute>
          } 
        />






        {/* Recruiter Dashboard Routes - Protected */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/recruiter" element={<DashboardHome />} />
          <Route path="/recruiter/company" element={<CompanyDashboard />} />
          <Route path="/recruiter/company/profile" element={<CompanyProfilePage />} />
          <Route path="/recruiter/company/branding" element={<CompanyBrandingPage />} />
          <Route path="/recruiter/company/jobs" element={<CompanyJobsPage />} />
          <Route path="/recruiter/company/analytics" element={<CompanyAnalyticsPage />} />
          <Route path="/recruiter/company/settings" element={<OrgSettingsPage />} />
          <Route path="/recruiter/company/team" element={<RecruiterTeamPage />} />
          <Route path="/recruiter/company/documents" element={<CompanyDocumentsPage />} />
          <Route path="/recruiter/company/ai-metrics" element={<CompanyAIMetricsPage />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobsDashboard />} />
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/edit/:id" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/applicants" element={<JobApplicantsPage />} />
          <Route path="/recruiter/candidates" element={<CandidatesPage />} />
          <Route path="/recruiter/candidates/:id" element={<CandidateDetailsPage />} />
          <Route path="/recruiter/analytics" element={<AnalyticsPage />} />
          <Route path="/recruiter/settings" element={<SettingsPage />} />
        </Route>


        {/* Standalone Candidate Interview Portal Routes */}
        <Route path="/interview" element={<InterviewPortal />} />
        <Route path="/interview/:id" element={<InterviewPortal />} />
        <Route path="/interview/:id/system-check" element={<SystemCheck />} />
        <Route path="/interview/:id/room" element={<InterviewRoom />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}



export default App

