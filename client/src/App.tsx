import { Routes, Route } from 'react-router-dom';
import { useUser } from './context/UserContext';
import { DisplayNamePrompt } from './components/identity/DisplayNamePrompt';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CreateShelfPage } from './pages/CreateShelfPage';
import { ShelfPage } from './pages/ShelfPage';

export function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }
  if (!user) {
    return <DisplayNamePrompt />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateShelfPage mode="create" />} />
        <Route path="/shelves/:id/edit" element={<CreateShelfPage mode="edit" />} />
        <Route path="/shelves/:id" element={<ShelfPage />} />
      </Routes>
    </AppLayout>
  );
}
