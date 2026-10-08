import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { getStoredTheme } from './theme.js';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { ToTopButton } from './components/Interactions.jsx';

import HomePage from './pages/HomePage.jsx';
import PostsPage from './pages/PostsPage.jsx';
import PostPage from './pages/PostPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import AdminLayout from './admin/AdminLayout.jsx';
import LoginPage from './admin/LoginPage.jsx';
import DashboardPage from './admin/DashboardPage.jsx';
import PostsAdminPage from './admin/PostsAdminPage.jsx';
import PostEditorPage from './admin/PostEditorPage.jsx';
import CommentsAdminPage from './admin/CommentsAdminPage.jsx';
import MessagesAdminPage from './admin/MessagesAdminPage.jsx';
import SubscribersAdminPage from './admin/SubscribersAdminPage.jsx';

/** Rota değişiminde sayfayı başa kaydır (hash bağlantıları hariç) */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const [theme, setTheme] = useState(getStoredTheme);
  const [categories, setCategories] = useState([]);

  // Footer'daki kategori bağlantıları için
  useEffect(() => {
    api.getMeta().then((m) => setCategories(m.categories)).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} data-theme={theme}>
      <ScrollManager />
      <Navbar theme={theme} setTheme={setTheme} />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Genel sayfalar */}
          <Route path="/" element={<HomePage />} />
          <Route path="/yazilar" element={<PostsPage />} />
          <Route path="/yazilar/:slug" element={<PostPage />} />
          <Route path="/hakkinda" element={<AboutPage />} />
          <Route path="/iletisim" element={<ContactPage />} />

          {/* Yönetim paneli */}
          <Route path="/admin" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="panel" element={<DashboardPage />} />
            <Route path="yazilar" element={<PostsAdminPage />} />
            <Route path="yazi/yeni" element={<PostEditorPage />} />
            <Route path="yazi/:id" element={<PostEditorPage />} />
            <Route path="yorumlar" element={<CommentsAdminPage />} />
            <Route path="mesajlar" element={<MessagesAdminPage />} />
            <Route path="aboneler" element={<SubscribersAdminPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer categories={categories} />
      <ToTopButton />
    </div>
  );
}
