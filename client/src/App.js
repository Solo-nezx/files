import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/dimensions-theme.css';

// Redux
import store from './store';
import { loadUser } from './features/auth/authSlice';

// Layout Components
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Dashboard Components
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

// Evaluation Components
import EvaluationList from './components/evaluations/EvaluationList';
import EvaluationForm from './components/evaluations/EvaluationForm';
import ResultsOverview from './components/results/ResultsOverview';
import ResultsDetail from './components/results/ResultsDetail';

// Admin Components
import UserManagement from './components/admin/UserManagement';
import EvaluationCycles from './components/admin/EvaluationCycles';
import FormBuilder from './components/admin/FormBuilder';
import EvaluationReports from './components/admin/EvaluationReports';

// Error & Misc Components
import NotFound from './components/misc/NotFound';
import Welcome from './components/misc/Welcome';

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            
            {/* Evaluations */}
            <Route path="/evaluations" element={<EvaluationList />} />
            <Route path="/evaluations/:evaluationId/:userId" element={<EvaluationForm />} />
            
            {/* Results */}
            <Route path="/results" element={<ResultsOverview />} />
            <Route path="/results/:cycleId" element={<ResultsDetail />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/admin/cycles" element={<AdminRoute><EvaluationCycles /></AdminRoute>} />
            <Route path="/admin/forms" element={<AdminRoute><FormBuilder /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><EvaluationReports /></AdminRoute>} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <ToastContainer position="top-right" autoClose={5000} />
      </Router>
    </Provider>
  );
};

export default App;