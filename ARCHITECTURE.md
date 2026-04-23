# HTB Global Architecture

This document provides an overview of the technical architecture and codebase structure for the HTB Global institutional lending platform.

## 🏗️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth) (Google OAuth)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Styling**: Vanilla CSS with a Material 3 inspired Design System
- **Icons**: [Google Material Symbols](https://fonts.google.com/icons)

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router routes
│   ├── (application)/    # Protected application flow routes
│   ├── (main)/           # Public-facing main landing pages
│   ├── auth/             # Authentication callback routes
│   └── login/            # Dedicated login page
├── components/           # Reusable UI components
│   ├── layout/           # Shared layout components (Navbar, Footer, Sidebar)
│   └── ui/               # Base UI primitive components
├── lib/                  # Shared libraries and state stores
│   └── store.ts          # Central Zustand store for the loan flow
├── utils/                # Utility functions and shared helpers
│   └── supabase/         # Supabase client and server configuration
└── proxy.ts              # Authentication & Route protection logic
```

## 🔐 Authentication Flow

The application uses a **Proxy Pattern** (formerly Middleware) for authentication:

1.  **Request Interception**: `src/proxy.ts` intercepts all requests.
2.  **Session Refresh**: It uses `src/utils/supabase/proxy.ts` to sync the user's session from cookies.
3.  **Route Protection**: Any request to `(application)` routes without a valid session is automatically redirected to `/login`.
4.  **Google OAuth**: Authentication is handled via Google. The callback is processed in `src/app/auth/callback/route.ts`.

## 🏦 Loan Application Logic

The loan application is a multi-step form managed by a central **Zustand store** (`src/lib/store.ts`).

- **Persistence**: The state is ephemeral during the session but can be persisted to Supabase if required in future phases.
- **Validation**: Each step validates its input before allowing progression to the next phase.
- **Summary**: The `summary` page aggregates all data from the store for final review.

## 🎨 Design System

The platform uses a custom design system defined in `src/app/globals.css` using CSS variables (tokens).

- **Personalization**: The UI terminology is tailored for the end customer ("You", "Your", "Verify Identity").
- **Dark/Light Mode**: Fully supported via `next-themes`.

---

## 🛠️ Onboarding New Developers

1.  **Environment Variables**: Ensure `.env` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2.  **Supabase Config**: Update the Google OAuth redirect URI to your local or production domain.
3.  **State Management**: Check `src/lib/store.ts` to add or modify data fields in the application flow.
