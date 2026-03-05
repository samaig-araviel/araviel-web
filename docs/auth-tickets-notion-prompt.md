# Araviel Web - User Auth & Profiles: Notion Ticket Prompt

## How to Use

Copy the entire prompt below into Notion AI on your Frontend board under Technology in Araveil Ltd Home. It will create 4 epics with 14 sub-tickets total.

---

## NOTION PROMPT

Create 4 epic tickets on the Frontend board under Technology. Each epic contains sub-tickets. Use the structure below exactly.

**Project context:** Araviel Web is a React 18 SPA (Vite 6, Redux Toolkit, CSS Modules, JavaScript) adding user authentication via Supabase Auth for UK MVP launch. Users must authenticate before using any features. Auth methods: Google OAuth and Email/Password. User tiers: free, pro, premium. Must comply with UK GDPR (Data Protection Act 2018).

---

### EPIC 1: Auth Foundation

**Epic Description:** Set up Supabase client, auth state management, and database schema. Everything else depends on this.

---

**Ticket 1.1: Supabase Client Setup**
Priority: High
Labels: auth, foundation, frontend

**Description**
Install the Supabase JS SDK and create the client config file. This is the base all auth features build on. Use PKCE flow for SPA security.

**Acceptance Criteria**
- [ ] `@supabase/supabase-js` installed as dependency
- [ ] `src/lib/supabase.js` exports a configured client with `flowType: 'pkce'`, `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`
- [ ] `.env.example` documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Client reads env vars via `import.meta.env.VITE_SUPABASE_*`
- [ ] App builds and runs without errors

**Dependencies**
- None

**Risks**
- Supabase project must be created in dashboard first with Google OAuth and Email providers enabled
- Redirect URLs must be configured in Supabase dashboard for OAuth to work

**Claude Code Prompt**
```
Install @supabase/supabase-js. Create src/lib/supabase.js that exports a Supabase client using createClient() with env vars VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (via import.meta.env). Auth options: autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: 'pkce'. Create .env.example with placeholder values for both vars. Do not modify any existing files except package.json.
```

---

**Ticket 1.2: Auth Redux Slice and Session Listener**
Priority: High
Labels: auth, state-management, frontend

**Description**
Create a Redux slice to hold auth state and a hook that subscribes to Supabase auth events. This connects Supabase sessions to our Redux state management.

**Acceptance Criteria**
- [ ] `src/store/slices/authSlice.js` exists with state: `{ user, userTier, isAuthenticated, isLoading, error, gdprConsent, needsConsent }`
- [ ] Reducers: `setUser`, `setUserTier`, `setLoading`, `setError`, `clearAuth`, `setGdprConsent`, `setNeedsConsent`
- [ ] Selectors: `selectUser`, `selectUserTier`, `selectIsAuthenticated`, `selectAuthLoading`, `selectNeedsConsent`
- [ ] Registered in `src/store/index.js`
- [ ] `src/hooks/useAuthListener.js` calls `supabase.auth.getSession()` on mount, subscribes to `onAuthStateChange`
- [ ] On SIGNED_IN: dispatches setUser, fetches tier from user_profiles table, writes tier to localStorage
- [ ] On SIGNED_OUT: dispatches clearAuth
- [ ] Sets isLoading false after initial session check
- [ ] Subscription cleaned up on unmount

**Dependencies**
- Ticket 1.1: Supabase Client Setup

**Risks**
- Session check must complete before app renders to avoid flash of wrong state
- onAuthStateChange can fire multiple times on OAuth redirect

**Claude Code Prompt**
```
Create src/store/slices/authSlice.js using createSlice from Redux Toolkit. State shape: { user: null, userTier: 'free', isAuthenticated: false, isLoading: true, error: null, gdprConsent: { essential: true, analytics: false, marketing: false, consentTimestamp: null }, needsConsent: false }. Export reducers: setUser, setUserTier, setLoading, setError, clearAuth, setGdprConsent, setNeedsConsent. Export selectors: selectUser, selectUserTier, selectIsAuthenticated, selectAuthLoading, selectAuthError, selectNeedsConsent. Register in src/store/index.js alongside existing slices (theme, sidebar, chat, analytics). Create src/hooks/useAuthListener.js: import supabase from src/lib/supabase.js, on mount call supabase.auth.getSession(), subscribe to supabase.auth.onAuthStateChange. On SIGNED_IN: extract { id, email, user_metadata.full_name or user_metadata.name, user_metadata.avatar_url or user_metadata.picture, app_metadata.provider } from session.user, dispatch setUser. Fetch tier: supabase.from('user_profiles').select('user_tier').eq('id', user.id).single(), dispatch setUserTier, write to localStorage key 'araviel-user-tier'. On SIGNED_OUT: dispatch clearAuth, remove 'araviel-user-tier' from localStorage. Set isLoading false after initial check. Return cleanup function. Follow patterns from src/store/slices/themeSlice.js and src/hooks/useUserLocation.js.
```

---

**Ticket 1.3: Supabase Database Schema**
Priority: High
Labels: auth, database, backend

**Description**
Set up Supabase tables for user profiles, consent records, and analytics. Row Level Security ensures users can only access their own data. Auto-create profile on signup.

**Acceptance Criteria**
- [ ] `user_profiles` table: id (PK, FK auth.users), display_name, avatar_url, user_tier (default 'free', check free/pro/premium), preferred_model, preferred_tone, preferred_mood, preferred_theme, auto_strategy, created_at, updated_at
- [ ] `user_consents` table: id (PK), user_id (FK auth.users), consent_type, granted, ip_address, user_agent, created_at
- [ ] `user_analytics` table: id (PK, FK auth.users), lifetime_stats (jsonb), updated_at
- [ ] RLS enabled on all tables. Users can only read/write their own rows
- [ ] Trigger auto-creates profile and analytics rows on auth.users insert
- [ ] Trigger handles both email signup and Google OAuth metadata shapes
- [ ] `premium` tier added to ACCESS_TIERS in `src/data/models.js` with access to all models

**Dependencies**
- Ticket 1.1: Supabase Client Setup

**Risks**
- Misconfigured RLS could expose data or block all access. Test policies thoroughly
- Trigger must handle nullable metadata fields from different auth providers

**Claude Code Prompt**
```
Apply Supabase migrations for three tables. (1) user_profiles: id uuid PK references auth.users on delete cascade, display_name text, avatar_url text, user_tier text default 'free' check (user_tier in ('free','pro','premium')), preferred_model text, preferred_tone text, preferred_mood text, preferred_theme text default 'system', auto_strategy text default 'default', created_at timestamptz default now(), updated_at timestamptz default now(). Enable RLS: select policy where auth.uid() = id, update policy where auth.uid() = id. (2) user_consents: id uuid default gen_random_uuid() PK, user_id uuid references auth.users on delete cascade, consent_type text not null, granted boolean not null, ip_address inet, user_agent text, created_at timestamptz default now(). Enable RLS: select where auth.uid() = user_id, insert with check auth.uid() = user_id. (3) user_analytics: id uuid PK references auth.users on delete cascade, lifetime_stats jsonb default '{}', updated_at timestamptz default now(). Enable RLS: all where auth.uid() = id. Create trigger function handle_new_user() that inserts into user_profiles (display_name from coalesce of raw_user_meta_data full_name, name, or email prefix; avatar_url from avatar_url or picture) and user_analytics on auth.users insert. Also update src/data/models.js: add 'premium' to ACCESS_TIERS giving access to all models, update getModelsForTier() and isModelAccessible() to handle 'premium'.
```

---

### EPIC 2: Auth UI

**Epic Description:** Build the login, signup, password reset, and email verification screens. Add route protection so unauthenticated users can only see auth pages.

---

**Ticket 2.1: Login and Signup Forms**
Priority: High
Labels: auth, ui, frontend

**Description**
Build the login and signup pages. Users sign in with email/password or Google. Signup includes GDPR consent checkboxes. Forms follow existing CSS Modules patterns.

**Acceptance Criteria**
- [ ] `src/components/AuthPage/AuthPage.jsx` renders LoginForm or SignupForm based on local state
- [ ] LoginForm: email + password fields, "Sign in with Google" button, "Forgot password?" link, "Sign up" link
- [ ] SignupForm: email + password + confirm password, "Sign up with Google" button, password strength indicator (8+ chars, uppercase, number)
- [ ] SignupForm required checkbox: "I agree to the Privacy Policy and Terms of Service" with links
- [ ] SignupForm optional checkbox: "I consent to analytics data collection to improve the service"
- [ ] Google OAuth calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- [ ] Email login calls `supabase.auth.signInWithPassword()`
- [ ] Email signup calls `supabase.auth.signUp()` with consent data in user metadata
- [ ] Inline validation: empty fields, password mismatch, weak password, invalid email format
- [ ] `react-hot-toast` installed, Toaster added to App.jsx
- [ ] Styled with CSS Modules using existing theme variables (--bg-primary, --text-primary, --border-color)
- [ ] Responsive on mobile

**Dependencies**
- Ticket 1.2: Auth Redux Slice and Session Listener

**Risks**
- Google OAuth redirect must work in both dev (localhost:5173) and production
- Supabase email verification may confuse users if inbox delivery is slow

**Claude Code Prompt**
```
Create src/components/AuthPage/ with AuthPage.jsx, LoginForm.jsx, SignupForm.jsx, AuthPage.module.css, index.js. AuthPage manages local authView state ('login'|'signup'|'reset-password'|'update-password'|'verify-email') and renders the matching form. LoginForm: email input, password input, submit button calling supabase.auth.signInWithPassword({ email, password }). Google button calling supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }). Links to switch to signup and reset-password views. SignupForm: email, password, confirmPassword with validation (8+ chars, 1 uppercase, 1 number, passwords match). Required checkbox "I agree to the Privacy Policy and Terms of Service" (Privacy Policy and Terms link to new tabs). Optional checkbox "I consent to analytics data collection". Submit calls supabase.auth.signUp({ email, password, options: { data: { display_name: email.split('@')[0], gdpr_consent_terms: true, gdpr_consent_analytics: analyticsChecked, consent_timestamp: new Date().toISOString() } } }). On success switch to verify-email view. Use CSS Modules following src/components/Sidebar/Sidebar.module.css patterns. Use CSS variables from src/index.css. Install react-hot-toast, add <Toaster position="top-right" /> in App.jsx. Show toast on errors. Import supabase from src/lib/supabase.js.
```

---

**Ticket 2.2: Password Reset and Email Verification**
Priority: High
Labels: auth, ui, frontend

**Description**
Add password reset flow and email verification screen. Handle Supabase email link redirects containing tokens in the URL.

**Acceptance Criteria**
- [ ] ResetPasswordForm: email input, submit calls `supabase.auth.resetPasswordForEmail()`
- [ ] UpdatePasswordForm: new password + confirm, submit calls `supabase.auth.updateUser({ password })`
- [ ] VerifyEmail: message telling user to check their inbox, "Back to login" link
- [ ] App detects Supabase URL hash params (type=recovery, type=signup) on load and shows correct view
- [ ] Success and error feedback via toast
- [ ] Expired link shows clear error message

**Dependencies**
- Ticket 2.1: Login and Signup Forms

**Risks**
- Supabase email links contain tokens in URL hash. Must parse before client auto-processes them
- Reset links expire after 24 hours. Need clear messaging for expired links

**Claude Code Prompt**
```
Add three components to src/components/AuthPage/: ResetPasswordForm.jsx (email input, submit calls supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }), shows toast on success "Check your email for a reset link"). UpdatePasswordForm.jsx (password + confirmPassword inputs with same validation as signup, submit calls supabase.auth.updateUser({ password }), on success show toast and switch to login view). VerifyEmail.jsx (heading "Check your email", message "We sent a verification link to your email address. Click the link to activate your account.", "Back to login" button). In AuthPage.jsx add authView states for reset-password, update-password, verify-email. In useAuthListener.js or App.jsx: on mount check window.location.hash for type=recovery - if found, set a flag so AuthPage shows UpdatePasswordForm. Style with existing AuthPage.module.css.
```

---

**Ticket 2.3: Route Protection and Auth Gate**
Priority: High
Labels: auth, routing, frontend

**Description**
Gate the entire app behind authentication. Unauthenticated users see only the auth page. Show a loading screen during initial Supabase session check.

**Acceptance Criteria**
- [ ] Unauthenticated users see only AuthPage. Cannot access chat, models, analytics, gallery
- [ ] Authenticated users redirected away from auth pages to home
- [ ] Loading screen shown while isLoading is true (initial session check)
- [ ] OAuth redirect handled without flashing login page
- [ ] Loading screen has the Araviel branding and subtle animation

**Dependencies**
- Ticket 2.1: Login and Signup Forms

**Risks**
- Flash of login page during OAuth redirect if loading state resolves too early
- Must not break existing activeItem view switching

**Claude Code Prompt**
```
Modify src/App.jsx: import selectIsAuthenticated and selectAuthLoading from authSlice. Call useAuthListener() at top of App. If isLoading is true, render LoadingScreen. If not authenticated, render AuthPage. If authenticated, render existing layout (Sidebar + view switch). Create src/components/LoadingScreen/LoadingScreen.jsx and LoadingScreen.module.css: centered container with Araviel logo or text "Araviel" and a subtle pulsing animation, using --bg-primary and --text-primary CSS vars. Ensure authenticated users on auth-related activeItems get redirected to 'home' by dispatching setActiveItem('home'). Add 'settings', 'privacy', 'terms' to the authenticated view switch. Keep all existing view switching logic intact.
```

---

### EPIC 3: Integration

**Epic Description:** Connect auth to existing features. Add auth headers to API calls, update tier system, sync preferences, and update the Sidebar with real user data.

---

**Ticket 3.1: API Client Auth Headers**
Priority: High
Labels: auth, api, frontend

**Description**
Add auth tokens to all API calls. Remove hardcoded user tier. Handle 401 responses by triggering re-authentication.

**Acceptance Criteria**
- [ ] `getAuthHeaders()` async function in api.js gets current session token from Supabase
- [ ] All fetch calls include `Authorization: Bearer <token>` when user is authenticated
- [ ] `sendMessage` no longer sends hardcoded `userTier: 'free'`. Backend determines tier from JWT
- [ ] 401 responses trigger `supabase.auth.signOut()` and clear Redux state
- [ ] Requests don't break if backend doesn't validate tokens yet (graceful degradation)

**Dependencies**
- Ticket 1.2: Auth Redux Slice and Session Listener

**Risks**
- Backend may not validate JWTs yet. Auth headers should be additive, not break existing flow
- Token could expire mid-SSE stream. Current stream should complete; next request gets refreshed token

**Claude Code Prompt**
```
Modify src/services/api.js. Add import { supabase } from '../lib/supabase'. Create async function getAuthHeaders() that calls const { data: { session } } = await supabase.auth.getSession(), returns { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' } if token exists, otherwise just { 'Content-Type': 'application/json' }. In sendMessage: remove hardcoded userTier: 'free' from request body. Call const authHeaders = await getAuthHeaders() and spread into fetch headers. Update fetchConversations, fetchConversationMessages, createSubConversation, fetchSubConversationMessages similarly. Add 401 handling: if response.status === 401, call supabase.auth.signOut() and throw new Error('Session expired').
```

---

**Ticket 3.2: Tier System and Sidebar Update**
Priority: High
Labels: auth, ui, frontend

**Description**
Update tier system to support premium. Make Sidebar show real user data (name, tier badge). Add Settings nav and Sign Out.

**Acceptance Criteria**
- [ ] `premium` tier in ACCESS_TIERS with access to all models
- [ ] `getUserTier()` reads from localStorage (kept in sync by authSlice)
- [ ] `isModelAccessible()` and `getModelsForTier()` handle premium
- [ ] Image generation limits updated for premium (25/day)
- [ ] Sidebar shows user display name and email
- [ ] Sidebar shows tier badge with visual differentiation (free=grey, pro=blue, premium=gold)
- [ ] Sidebar has "Settings" nav item dispatching setActiveItem('settings')
- [ ] Sidebar has "Sign out" option calling supabase.auth.signOut()

**Dependencies**
- Ticket 1.2: Auth Redux Slice and Session Listener
- Ticket 1.3: Supabase Database Schema

**Risks**
- getUserTier() is called at module import time in chatSlice.js. localStorage sync ensures it works before Redux is ready
- Sidebar layout changes may affect responsive styles

**Claude Code Prompt**
```
Update src/data/models.js: add 'premium' to ACCESS_TIERS giving access to all models (copy pro list, add any remaining models). Update getModelsForTier() and isModelAccessible() for 'premium'. Keep getUserTier() reading from localStorage('araviel-user-tier'). Update src/services/imageGeneration.js: add premium tier limit of 25 images/day. Update src/components/Sidebar/Sidebar.jsx: import selectUser and selectUserTier from authSlice, import supabase from src/lib/supabase. In the sidebar footer section, replace any hardcoded user text with: user.displayName or user.email, tier badge span with CSS class for tier (free: grey background, pro: blue, premium: gold/amber). Add "Settings" button/link in nav that dispatches setActiveItem('settings') using the sidebar's existing nav pattern. Add "Sign out" button that calls supabase.auth.signOut(). Style tier badges in Sidebar.module.css using existing CSS vars.
```

---

**Ticket 3.3: GDPR Cookie Consent Banner**
Priority: High
Labels: gdpr, ui, frontend

**Description**
Add a cookie consent banner before any analytics load. UK GDPR requires opt-in for non-essential cookies. Vercel SpeedInsights gated behind consent.

**Acceptance Criteria**
- [ ] Banner appears on first visit if no consent stored
- [ ] Three categories: Essential (always on, greyed out), Analytics (off by default), Marketing (off by default)
- [ ] "Accept All" and "Save Preferences" buttons
- [ ] Consent stored in localStorage `araviel-cookie-consent` with timestamp
- [ ] After auth, consent synced to user_consents table in Supabase
- [ ] Vercel SpeedInsights only renders if analytics consent is true
- [ ] Banner re-accessible from Settings privacy section
- [ ] Fixed bottom position, non-intrusive, theme-consistent

**Dependencies**
- Ticket 1.2: Auth Redux Slice and Session Listener

**Risks**
- No analytics scripts must fire before consent. Verify no other tracking exists
- Banner must work for unauthenticated users too (they see it on the login page)

**Claude Code Prompt**
```
Create src/components/CookieBanner/CookieBanner.jsx and CookieBanner.module.css. Banner appears fixed at bottom of viewport if localStorage.getItem('araviel-cookie-consent') is null. Three toggle rows: Essential (always on, toggle disabled), Analytics (off by default), Marketing (off by default). "Accept All" button sets all true. "Save Preferences" saves current choices. On save: store JSON { essential: true, analytics: bool, marketing: bool, timestamp: new Date().toISOString() } in localStorage key 'araviel-cookie-consent'. Export helper function getCookieConsent() that reads and parses this key. In src/App.jsx: render CookieBanner (both in auth and main app sections so it shows on login page too). Conditionally render <SpeedInsights /> only if getCookieConsent()?.analytics === true. Style with CSS Modules: semi-transparent backdrop, card with rounded corners, using --bg-secondary, --text-primary, --border-color vars. Responsive.
```

---

**Ticket 3.4: Preference Sync to Supabase**
Priority: Medium
Labels: auth, sync, frontend

**Description**
Sync user preferences between Redux/localStorage and Supabase. On login, pull preferences from Supabase. On change, debounce-write to Supabase.

**Acceptance Criteria**
- [ ] `src/hooks/usePreferenceSync.js` runs for authenticated users
- [ ] On login: fetch preferences from user_profiles, write to localStorage and Redux
- [ ] On preference change (theme, model, tone, mood): debounced 500ms write to Supabase
- [ ] On logout: localStorage preferences stay for next login on this device
- [ ] No data loss. Supabase values take priority on conflict

**Dependencies**
- Ticket 1.3: Supabase Database Schema
- Ticket 3.1: API Client Auth Headers

**Risks**
- Rapid preference changes could cause out-of-order writes. Debouncing handles this
- First login: no Supabase preferences exist yet. Upload current localStorage values

**Claude Code Prompt**
```
Create src/hooks/usePreferenceSync.js. Only runs when selectIsAuthenticated is true. On mount after auth: call supabase.from('user_profiles').select('preferred_model, preferred_tone, preferred_mood, preferred_theme, auto_strategy').eq('id', user.id).single(). If Supabase has non-null values, write to localStorage (araviel-selected-model, araviel-theme, etc) and dispatch Redux updates (setThemeMode, etc). If all null (new user), read from localStorage and write to Supabase. Watch Redux state changes for theme, selectedModel, tone, mood using useSelector. On change, debounce 500ms and call supabase.from('user_profiles').update({ preferred_model, preferred_tone, preferred_mood, preferred_theme }).eq('id', user.id). Call this hook in App.jsx inside the authenticated section, after useAuthListener.
```

---

### EPIC 4: Compliance & Settings

**Epic Description:** Build the settings page, legal pages, Google OAuth consent flow, and account management (data export + deletion). Everything needed for GDPR-compliant UK launch.

---

**Ticket 4.1: Settings View**
Priority: High
Labels: ui, settings, frontend

**Description**
Settings page with profile management, app preferences, and privacy controls. Users manage their account and data from here.

**Acceptance Criteria**
- [ ] Renders when activeItem is 'settings'
- [ ] Profile section: email (read-only), editable display name (saves to Supabase), avatar from Google or initials
- [ ] "Change password" hidden for Google OAuth users
- [ ] Preferences section: theme selector, default model, tone picker, mood picker
- [ ] Privacy section: analytics/marketing consent toggles, "Export my data" button, "Delete my account" button
- [ ] "Sign out" button at bottom
- [ ] Styled with CSS Modules, responsive

**Dependencies**
- Ticket 2.3: Route Protection and Auth Gate
- Ticket 3.2: Tier System and Sidebar Update

**Risks**
- Display name save requires Supabase write. Handle loading and error states
- Must not break existing theme/model selection

**Claude Code Prompt**
```
Create src/components/SettingsView/ with SettingsView.jsx, ProfileSection.jsx, PreferencesSection.jsx, PrivacySection.jsx, SettingsView.module.css, index.js. SettingsView renders three collapsible sections. ProfileSection: circular avatar (user.avatarUrl or colored circle with initials), email text (read-only), display name input with "Save" button that calls supabase.from('user_profiles').update({ display_name }).eq('id', user.id) and shows toast. "Change password" button hidden if user.provider === 'google'. PreferencesSection: theme toggle (light/dark/system using existing themeSlice dispatch), default model dropdown (from getModelsForTier), tone and mood selectors. PrivacySection: analytics toggle, marketing toggle (read/write to localStorage cookie-consent and dispatch to Redux), "Export my data" button (disabled, tooltip "Coming in next update"), "Delete my account" button (disabled, tooltip "Coming in next update"). Sign out button at bottom calling supabase.auth.signOut(). Add to App.jsx view switch: activeItem === 'settings' && <SettingsView />. Style with CSS Modules using theme vars, card-based layout.
```

---

**Ticket 4.2: Privacy Policy Page**
Priority: High
Labels: gdpr, legal, frontend

**Description**
UK GDPR-compliant Privacy Policy page. Must be accessible before and after authentication. Covers data collection, legal basis, user rights, and ICO complaint procedure.

**Acceptance Criteria**
- [ ] Renders at activeItem 'privacy', accessible to unauthenticated users
- [ ] Sections: What We Collect, How We Use It, Legal Basis, Data Retention, Third Parties, Your Rights, Complaints, Contact
- [ ] Lists all third-party processors: Supabase, Vercel, Google
- [ ] Includes ICO complaint procedure with contact details
- [ ] Covers all data subject rights: access, rectification, erasure, portability, restriction, objection
- [ ] Written in plain English, no legal jargon
- [ ] Accessible from signup form, cookie banner, settings, and standalone

**Dependencies**
- Ticket 2.3: Route Protection and Auth Gate

**Risks**
- Content should be reviewed by a legal professional before production launch
- Must be updated when data processing activities change

**Claude Code Prompt**
```
Create src/components/LegalPages/PrivacyPolicy.jsx, LegalPages.module.css, index.js. Render a well-structured document with these sections:

1. "What We Collect" - Email address and display name (account creation), Conversation history (to provide the chat service), App preferences: theme, model selection, tone, mood (to personalise your experience), Usage statistics: message counts, feature usage (to improve the service, only with your consent), Location data (only if you grant permission, to provide weather context)

2. "How We Use Your Data" - To provide and maintain the Araviel chat service, To personalise your experience based on your preferences, To determine your account tier and available features, To improve the service through anonymised analytics (only with consent)

3. "Legal Basis for Processing" - Contract: We process your account and conversation data to provide the service you signed up for. Consent: Analytics and marketing data is only processed if you opt in. You can withdraw consent at any time in Settings. Legitimate interest: We process minimal technical data (error logs) to keep the service running securely.

4. "Data Retention" - Active accounts: your data is retained while your account exists. Deleted accounts: all data is permanently removed within 30 days. Consent records: retained for 3 years as required for compliance evidence.

5. "Third-Party Processors" - Supabase (database and authentication, data stored in EU), Vercel (hosting and deployment, edge network), Google (OAuth authentication, only if you choose Google sign-in). We do not sell your data to third parties.

6. "Your Rights" - Under UK GDPR you have the right to: Access your data (use "Export my data" in Settings), Correct inaccurate data (edit your profile in Settings), Delete your data (use "Delete my account" in Settings), Data portability (export provides machine-readable JSON), Restrict processing (contact us), Object to processing (contact us). To exercise any right, email privacy@araviel.com or use the self-service options in Settings.

7. "Complaints" - If you are unhappy with how we handle your data, you can complain to the Information Commissioner's Office (ICO): Website: ico.org.uk, Phone: 0303 123 1113, Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF.

8. "Contact Us" - Data Controller: Araveil Ltd, Email: privacy@araviel.com. This policy was last updated on [current date].

Style as a readable document: max-width 800px, centered, good typography, proper heading hierarchy. Add to App.jsx public routes and authenticated view switch.
```

---

**Ticket 4.3: Terms of Service Page**
Priority: High
Labels: gdpr, legal, frontend

**Description**
Terms of Service page covering account responsibilities, acceptable use, and governing law (England and Wales).

**Acceptance Criteria**
- [ ] Renders at activeItem 'terms', accessible to unauthenticated users
- [ ] Covers: acceptance, account responsibilities, acceptable use, intellectual property, service availability, limitation of liability, termination, governing law
- [ ] Governing law: England and Wales
- [ ] Plain English, no unnecessary jargon
- [ ] Accessible from signup form and settings

**Dependencies**
- Ticket 2.3: Route Protection and Auth Gate

**Risks**
- Should be reviewed by legal professional before production launch

**Claude Code Prompt**
```
Create src/components/LegalPages/TermsOfService.jsx in the existing LegalPages directory. Sections:

1. "Acceptance" - By creating an account or using Araviel, you agree to these terms. If you do not agree, do not use the service.

2. "The Service" - Araviel is an AI chat assistant. We provide access to various AI models depending on your account tier (Free, Pro, or Premium). Features and model availability may change.

3. "Your Account" - You must provide accurate information when signing up. You are responsible for keeping your login credentials secure. You must be at least 18 years old to use this service. One account per person.

4. "Acceptable Use" - Do not use Araviel to: generate illegal, harmful, or abusive content; attempt to bypass usage limits or tier restrictions; reverse-engineer, scrape, or extract data from the service; impersonate others or misrepresent your identity; interfere with the service's operation. We reserve the right to suspend accounts that violate these terms.

5. "Your Content" - You own the content you create through Araviel. We do not claim ownership of your conversations. We store your data as described in our Privacy Policy to provide the service.

6. "Service Availability" - We aim to keep Araviel available but do not guarantee uninterrupted access. We may perform maintenance, updates, or changes to features. We will try to give reasonable notice of significant changes.

7. "Limitation of Liability" - Araviel is provided "as is". AI responses may be inaccurate. Do not rely on Araviel for medical, legal, financial, or other professional advice. To the maximum extent permitted by law, Araveil Ltd is not liable for indirect or consequential damages.

8. "Termination" - You can delete your account at any time in Settings. We may suspend or terminate accounts that violate these terms. On termination, your data will be handled as described in our Privacy Policy.

9. "Changes to Terms" - We may update these terms. We will notify you of significant changes via email or in-app notification. Continued use after changes means you accept the new terms.

10. "Governing Law" - These terms are governed by the laws of England and Wales. Disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.

11. "Contact" - Questions about these terms: legal@araviel.com. Araveil Ltd.

Reuse LegalPages.module.css. Add to App.jsx view switch.
```

---

**Ticket 4.4: Google OAuth GDPR Consent Modal**
Priority: High
Labels: auth, gdpr, frontend

**Description**
Google OAuth users skip the signup form and its consent checkboxes. Show a one-time GDPR consent modal for new Google users before they can use the app.

**Acceptance Criteria**
- [ ] After Google OAuth login, check user_consents table for existing records
- [ ] If no consent records: show full-screen modal with required Terms/Privacy checkbox and optional analytics checkbox
- [ ] Modal cannot be dismissed without accepting required consent
- [ ] On accept: write records to user_consents table with consent_type, granted, timestamp
- [ ] Modal only appears once per user (subsequent logins skip it)
- [ ] Styled consistently with auth page

**Dependencies**
- Ticket 2.1: Login and Signup Forms
- Ticket 3.3: GDPR Cookie Consent Banner

**Risks**
- Must not block returning Google users who already consented
- Modal must appear after auth is fully resolved

**Claude Code Prompt**
```
Create src/components/AuthPage/GdprConsentModal.jsx. Full-screen modal overlay using createPortal to document.body (same pattern as ShareModal in src/components/MainContent/MainContent.jsx). Shows: "Welcome to Araviel" heading, brief text "Before you continue, we need your consent.", required checkbox "I agree to the Privacy Policy and Terms of Service" with links opening new tabs, optional checkbox "I consent to analytics data collection to improve the service". "Continue" button disabled until required checkbox checked. On continue: call supabase.from('user_consents').insert([ { user_id: user.id, consent_type: 'terms_privacy', granted: true, user_agent: navigator.userAgent }, { user_id: user.id, consent_type: 'analytics', granted: analyticsChecked, user_agent: navigator.userAgent } ]). Dispatch setNeedsConsent(false). In useAuthListener.js: after SIGNED_IN for Google users (check provider), query supabase.from('user_consents').select('id').eq('user_id', user.id).limit(1). If no rows, dispatch setNeedsConsent(true). In App.jsx: if authenticated and selectNeedsConsent is true, render GdprConsentModal on top of the main app. Style with AuthPage.module.css or inline modal styles.
```

---

**Ticket 4.5: Account Deletion and Data Export**
Priority: High
Labels: gdpr, settings, frontend

**Description**
Implement GDPR right to erasure and data portability. Users can download all their data as JSON and permanently delete their account.

**Acceptance Criteria**
- [ ] "Export my data" fetches all user data from Supabase and triggers JSON download
- [ ] Export includes: profile, consent records, analytics, conversation list
- [ ] "Delete my account" shows confirmation dialog requiring user to type "DELETE"
- [ ] Dialog explains exactly what will be deleted
- [ ] Deletion cascades: user_profiles, user_consents, user_analytics, auth.users
- [ ] After deletion: sign out, clear localStorage, redirect to login
- [ ] Toast confirms successful export or deletion

**Dependencies**
- Ticket 4.1: Settings View
- Ticket 1.3: Supabase Database Schema

**Risks**
- Supabase client cannot delete auth.users directly. Need a database function with security definer
- Deletion is irreversible. Confirmation UX must be very clear
- Data export must include ALL user data for GDPR compliance

**Claude Code Prompt**
```
Update src/components/SettingsView/PrivacySection.jsx. Enable "Export my data": on click, show loading state, fetch supabase.from('user_profiles').select('*').eq('id', user.id).single(), supabase.from('user_consents').select('*').eq('user_id', user.id), supabase.from('user_analytics').select('*').eq('id', user.id).single(). Combine into { profile, consents, analytics, exportDate: new Date().toISOString() }. Create Blob with JSON.stringify(data, null, 2), create download link, trigger click, revoke URL. Show toast "Data exported successfully". Enable "Delete my account": on click show modal (inline component or createPortal). Modal text: "This will permanently delete your account and all associated data including your profile, conversations, preferences, and analytics. This action cannot be undone." Input field with placeholder "Type DELETE to confirm". "Delete my account" button enabled only when input === 'DELETE', styled red/destructive. On confirm: call supabase.rpc('delete_user_account') (create Supabase function: create or replace function delete_user_account() returns void as $$ begin delete from auth.users where id = auth.uid(); end; $$ language plpgsql security definer). After success: supabase.auth.signOut(), clear all localStorage keys starting with 'araviel-', show toast "Account deleted", which redirects to login via auth state change.
```

---

### Implementation Order Summary

```
Epic 1 - Foundation (do first, everything depends on this):
  1.1 Supabase Client  -->  1.2 Auth Slice + Listener  (1.3 Schema can parallel with 1.2)

Epic 2 - Auth UI (do second):
  2.1 Login/Signup  -->  2.2 Password Reset  -->  2.3 Route Protection

Epic 3 - Integration (do third, can start once Epic 1 is done):
  3.1 API Headers  -->  3.2 Tier + Sidebar  -->  3.3 Cookie Banner  -->  3.4 Preference Sync

Epic 4 - Compliance & Settings (do last):
  4.1 Settings  -->  4.2 Privacy Policy  -->  4.3 Terms  -->  4.4 OAuth Consent  -->  4.5 Account Deletion
```

### Verification Checklist (after all tickets done)

- [ ] `npm run build` passes
- [ ] Sign up with email -> verify -> login -> see main app
- [ ] Sign in with Google -> consent modal -> accept -> see main app
- [ ] Refresh page while logged in -> stays logged in (no flash)
- [ ] Clear session -> refresh -> see login page only
- [ ] Sidebar shows real user name and tier badge
- [ ] Network tab shows Authorization header on API calls
- [ ] Cookie banner appears on fresh visit, SpeedInsights blocked until consent
- [ ] Settings: edit name, change preferences, sign out
- [ ] Privacy Policy and Terms accessible from login page
- [ ] Mobile responsive on all auth and settings screens
