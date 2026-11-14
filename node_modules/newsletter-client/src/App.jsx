import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewsletterList from './pages/NewsletterList';
import NewsletterForm from './pages/NewsletterForm';
import NewsletterView from './pages/NewsletterView';
import Subscribers from './pages/Subscribers';
import Campaigns from './pages/Campaigns';
import Unsubscribe from './pages/Unsubscribe';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/newsletters/:slug" element={<NewsletterView />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/newsletters" element={<NewsletterList />} />
                <Route path="/newsletters/new" element={<NewsletterForm />} />
                <Route path="/newsletters/:id/edit" element={<NewsletterForm />} />
                <Route path="/subscribers" element={<Subscribers />} />
                <Route path="/campaigns" element={<Campaigns />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
