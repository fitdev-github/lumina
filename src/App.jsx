import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { FinanceProvider } from '@/contexts/FinanceContext'
import { AIInsightsProvider } from '@/contexts/AIInsightsContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import AIAssistant from './pages/AIAssistant'
import AddTransaction from './pages/AddTransaction'
import Goals from './pages/Goals'
import DebtManagement from './pages/DebtManagement'
import BudgetTracking from './pages/BudgetTracking'
import TransactionList from './pages/TransactionList'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Security from './pages/Security'
import Help from './pages/Help'
import Terms from './pages/Terms'
import FinancialStatus from './pages/FinancialStatus'
import FixedExpenses from './pages/FixedExpenses'
import CryptoPortfolio from './pages/CryptoPortfolio'
import MonthlyChecklist from './pages/MonthlyChecklist'

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AIInsightsProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <AIAssistant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add"
                element={
                  <ProtectedRoute>
                    <AddTransaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debt"
                element={
                  <ProtectedRoute>
                    <DebtManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget"
                element={
                  <ProtectedRoute>
                    <BudgetTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <ProfileEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/security"
                element={
                  <ProtectedRoute>
                    <Security />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/terms"
                element={
                  <ProtectedRoute>
                    <Terms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financial-status"
                element={
                  <ProtectedRoute>
                    <FinancialStatus />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/fixed-expenses"
                element={
                  <ProtectedRoute>
                    <FixedExpenses />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/crypto"
                element={
                  <ProtectedRoute>
                    <CryptoPortfolio />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/checklist"
                element={
                  <ProtectedRoute>
                    <MonthlyChecklist />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AIInsightsProvider>
      </FinanceProvider>
    </AuthProvider>
  )
}

export default App
