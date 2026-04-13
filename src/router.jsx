import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import MainContent from './components/MainContent';
import ConversationsView from './components/ConversationsView';
import ConversationRoute from './components/ConversationRoute';
import ProjectsView from './components/ProjectsView';
import ImageGalleryView from './components/ImageGalleryView';
import ModelsView from './components/ModelsView';
import SettingsView from './components/SettingsView';
import PricingView from './components/PricingView/PricingView';
import SubscriptionView from './components/SubscriptionView/SubscriptionView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <MainContent /> },
      { path: 'conversations', element: <ConversationsView /> },
      { path: 'conversations/:id', element: <ConversationRoute /> },
      { path: 'chat/:id', element: <ConversationRoute /> },
      { path: 'projects', element: <ProjectsView /> },
      { path: 'projects/:id', element: <ProjectsView /> },
      { path: 'images', element: <ImageGalleryView /> },
      { path: 'images/:id', element: <ImageGalleryView /> },
      { path: 'models', element: <ModelsView /> },
      { path: 'settings', element: <SettingsView /> },
      { path: 'settings/:section', element: <SettingsView /> },
      { path: 'plans', element: <PricingView /> },
      { path: 'subscription', element: <SubscriptionView /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
