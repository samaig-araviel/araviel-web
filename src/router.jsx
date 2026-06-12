import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import MainContent from './components/MainContent';
import ConversationsView from './components/ConversationsView';
import ConversationRoute from './components/ConversationRoute';
import ProjectsView from './components/ProjectsView';
import ImageGalleryView from './components/ImageGalleryView';
import SearchView from './components/SearchView';
import ModelsView from './components/ModelsView';
import SettingsView from './components/SettingsView';
import PricingView from './components/PricingView/PricingView';
import SubscriptionView from './components/SubscriptionView/SubscriptionView';
import SharedConversationView from './components/SharedConversationView';
import SharedView from './components/SharedView';
import RouteErrorBoundary from './components/ErrorBoundary/RouteErrorBoundary';
import NotFound from './components/ErrorBoundary/NotFound';
import RouteShell from './components/RouteShell/RouteShell';
import { AuthRoute, VerifyAgeView, CheckEmailView } from './components/Auth';
import { WEB_APPLICATION_JSON_LD, ORGANIZATION_JSON_LD } from './lib/seo';

const router = createBrowserRouter([
  // Public shared-conversation viewer. Deliberately a sibling of <App />
  // (not a child) so it does NOT mount the sidebar, auth gate, or any
  // owner-side chrome. Unauthenticated visitors land straight into the
  // read-only snapshot.
  {
    path: '/share/:token',
    element: (
      <RouteShell
        feature="share-viewer"
        seo={{
          title: 'Shared conversation',
          description: 'A read-only shared snapshot of an Araviel conversation.',
          ogType: 'article',
        }}
      >
        <SharedConversationView />
      </RouteShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <RouteShell
            feature="home"
            seo={{
              title: undefined,
              description:
                'Chat with every leading AI model from one place. Route to the best model for the task, keep your projects organized, and stay in flow.',
              jsonLd: WEB_APPLICATION_JSON_LD,
              jsonLdId: 'home.webapp',
            }}
          >
            <MainContent />
          </RouteShell>
        ),
      },
      {
        path: 'login',
        element: (
          <RouteShell
            feature="login"
            seo={{
              title: 'Sign in',
              description: 'Sign in to your Araviel account.',
              noindex: true,
            }}
          >
            <AuthRoute initialTab="signin" />
          </RouteShell>
        ),
      },
      {
        path: 'signup',
        element: (
          <RouteShell
            feature="signup"
            seo={{
              title: 'Sign up',
              description: 'Create a free Araviel account.',
              noindex: true,
            }}
          >
            <AuthRoute initialTab="signup" />
          </RouteShell>
        ),
      },
      {
        path: 'signup/verify-age',
        element: (
          <RouteShell
            feature="signup-verify-age"
            seo={{
              title: 'Verify your age',
              description:
                'Confirm your date of birth to complete signing up for Araviel. You must be 13 or older.',
              noindex: true,
            }}
          >
            <VerifyAgeView />
          </RouteShell>
        ),
      },
      {
        path: 'signup/check-email',
        element: (
          <RouteShell
            feature="signup-check-email"
            seo={{
              title: 'Check your email',
              description:
                'We sent a confirmation link to your email — click it to finish setting up your Araviel account.',
              noindex: true,
            }}
          >
            <CheckEmailView />
          </RouteShell>
        ),
      },
      {
        path: 'conversations',
        element: (
          <RouteShell feature="conversations" seo={{ title: 'Conversations', noindex: true }}>
            <ConversationsView />
          </RouteShell>
        ),
      },
      {
        path: 'conversations/:id',
        element: (
          <RouteShell feature="chat" seo={{ title: 'Chat', noindex: true }}>
            <ConversationRoute />
          </RouteShell>
        ),
      },
      {
        path: 'chat/:id',
        element: (
          <RouteShell feature="chat" seo={{ title: 'Chat', noindex: true }}>
            <ConversationRoute />
          </RouteShell>
        ),
      },
      {
        path: 'shared',
        element: (
          <RouteShell feature="shared" seo={{ title: 'Shared chats', noindex: true }}>
            <SharedView />
          </RouteShell>
        ),
      },
      {
        path: 'projects',
        element: (
          <RouteShell feature="projects" seo={{ title: 'Projects', noindex: true }}>
            <ProjectsView />
          </RouteShell>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <RouteShell feature="projects" seo={{ title: 'Project', noindex: true }}>
            <ProjectsView />
          </RouteShell>
        ),
      },
      {
        path: 'images',
        element: (
          <RouteShell feature="images" seo={{ title: 'Image gallery', noindex: true }}>
            <ImageGalleryView />
          </RouteShell>
        ),
      },
      {
        path: 'images/:id',
        element: (
          <RouteShell feature="images" seo={{ title: 'Image', noindex: true }}>
            <ImageGalleryView />
          </RouteShell>
        ),
      },
      {
        path: 'search',
        element: (
          <RouteShell feature="search" seo={{ title: 'Search', noindex: true }}>
            <SearchView />
          </RouteShell>
        ),
      },
      {
        path: 'models',
        element: (
          <RouteShell feature="models" seo={{ title: 'Models', noindex: true }}>
            <ModelsView />
          </RouteShell>
        ),
      },
      {
        path: 'settings',
        element: (
          <RouteShell feature="settings" seo={{ title: 'Settings', noindex: true }}>
            <SettingsView />
          </RouteShell>
        ),
      },
      {
        path: 'settings/:section',
        element: (
          <RouteShell feature="settings" seo={{ title: 'Settings', noindex: true }}>
            <SettingsView />
          </RouteShell>
        ),
      },
      {
        path: 'plans',
        element: (
          <RouteShell
            feature="pricing"
            seo={{
              title: 'Plans & pricing',
              description:
                'Pick the Araviel plan that fits how you work — from free guest access to the full multi-model workspace.',
              jsonLd: ORGANIZATION_JSON_LD,
              jsonLdId: 'plans.org',
            }}
          >
            <PricingView />
          </RouteShell>
        ),
      },
      {
        path: 'subscription',
        element: (
          <RouteShell feature="subscription" seo={{ title: 'Subscription', noindex: true }}>
            <SubscriptionView />
          </RouteShell>
        ),
      },
      // 404 — authenticated shell preserved so the user can still navigate
      // away via the sidebar rather than bouncing back to the home screen.
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
