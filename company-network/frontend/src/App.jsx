import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import IncomingRequests from './pages/IncomingRequests';
import RequirementAnalysis from './pages/RequirementAnalysis';
import AIAnalysisConsole from './pages/AIAnalysisConsole';
import ProposalApproval from './pages/ProposalApproval';
import ProposalHistory from './pages/ProposalHistory';
import Messages from './pages/Messages';
import Layout from './components/Layout';
import './App.css';
import './index.css';
import './layout.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incoming-requests" element={<IncomingRequests />} />
            <Route path="/requirement-analysis" element={<RequirementAnalysis />} />
            <Route path="/ai-analysis" element={<AIAnalysisConsole />} />
            <Route path="/proposal-approval" element={<ProposalApproval />} />
            <Route path="/proposal-history" element={<ProposalHistory />} />
            <Route path="/messages" element={<Messages />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
