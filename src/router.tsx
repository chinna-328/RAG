import { createBrowserRouter, Navigate } from 'react-router-dom';

import { Landing } from './pages/Landing';
import { AppLayout } from './pages/AppLayout';
import { LibraryPage } from './pages/Library';
import { UploadPage } from './pages/Upload';
import { ChatPage } from './pages/Chat';
import { SettingsPage } from './pages/Settings';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'upload/:id', element: <UploadPage /> },
      { path: 'notebooks/:id', element: <ChatPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
