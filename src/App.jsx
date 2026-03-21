import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import MyBook from './pages/MyBook';
import Feed from './pages/Feed';
import Favorites from './pages/Favorites';
import AddEditRecipe from './pages/AddEditRecipe';
import RecipeDetail from './pages/RecipeDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/my-book" replace /> : <Login />} />
      <Route path="/my-book" element={<RequireAuth><MyBook /></RequireAuth>} />
      <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
      <Route path="/add-recipe" element={<RequireAuth><AddEditRecipe /></RequireAuth>} />
      <Route path="/edit-recipe/:id" element={<RequireAuth><AddEditRecipe /></RequireAuth>} />
      <Route path="/recipe/:id" element={<RequireAuth><RecipeDetail /></RequireAuth>} />
      <Route path="/profile/:userId" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/my-book" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
