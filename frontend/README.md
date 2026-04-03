# PingSight Frontend

Modern Next.js 15 frontend for the PingSight uptime monitoring platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Regenerate API client from OpenAPI spec
npm run generate:api
```

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Dashboard page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── DashboardFooter.tsx
│   │
│   ├── auth/                     # Authentication
│   │   ├── LoginModal.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   │
│   └── monitors/                 # Monitor components
│       ├── MonitorCard.tsx
│       ├── MonitorList.tsx
│       └── StatsCard.tsx
│
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Authentication state
│
├── lib/                          # Utilities & config
│   ├── api/                      # Generated API client
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Helper functions
│   └── constants/                # App constants
│
└── types/                        # TypeScript types
    └── index.ts
```

## 🎨 Component Library

### UI Components

```typescript
import { Button, Input, Modal, Card, StatusBadge } from '@/components/ui';

// Button with variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>

// Input with label
<Input label="EMAIL" type="email" placeholder="user@domain.com" />

// Modal dialog
<Modal isOpen={isOpen} onClose={onClose} title="Title">
  {children}
</Modal>

// Card container
<Card className="p-6" borderColor="#10b981">
  Content
</Card>

// Status badge
<StatusBadge status="UP" showLed />
```

### Custom Hooks

```typescript
import { useMonitors } from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

// Fetch monitors with auto-refresh
const { monitors, loading, error, refetch } = useMonitors();

// Authentication
const { user, isAuthenticated, login, logout } = useAuth();
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### OAuth Setup

PingSight uses OAuth 2.0 for authentication. See [OAuth Setup Guide](./OAUTH_SETUP.md) for detailed configuration.

Quick setup:
1. Configure Google OAuth credentials in backend
2. Users click "Sign In" and choose provider
3. Authenticate with Google/GitHub
4. Automatically redirected to dashboard

### API Client

The API client is auto-generated from the backend OpenAPI spec:

```bash
# Regenerate when backend API changes
npm run generate:api
```

Import and use:

```typescript
import { client } from '@/lib/api/client.gen';

// Client is configured with base URL and auth headers
// in AuthContext
```

## 📚 Documentation

- [Structure Guide](./STRUCTURE.md) - Detailed architecture documentation
- [Restructure Summary](./RESTRUCTURE_SUMMARY.md) - Migration notes

## 🎯 Key Features

- ✅ **Modern Stack**: Next.js 15, React 19, TypeScript
- ✅ **Component Library**: Reusable UI components
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Auto-generated API**: OpenAPI client generation
- ✅ **Custom Hooks**: Reusable data fetching logic
- ✅ **Authentication**: JWT-based auth with social login
- ✅ **Real-time Updates**: Auto-refreshing monitor data
- ✅ **Responsive Design**: Mobile-friendly UI

## 🏗️ Architecture Principles

1. **Component-Based**: Small, focused, reusable components
2. **Type-Safe**: TypeScript throughout
3. **Separation of Concerns**: Clear boundaries between UI, logic, and data
4. **DRY**: Don't Repeat Yourself - extract common patterns
5. **Performance**: Optimized rendering and data fetching

## 🧪 Development

### Adding a New Feature

1. **Define Types**: Add interfaces to `types/index.ts`
2. **Create Components**: Build UI in `components/`
3. **Add Logic**: Create hooks in `lib/hooks/`
4. **Compose Page**: Use components in `app/`

### Code Style

- Use functional components with hooks
- Prefer TypeScript interfaces over types
- Use `@/` alias for imports
- Keep components under 200 lines
- Extract complex logic to custom hooks

## 🚢 Deployment

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel (recommended)
vercel deploy
```

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **API Client**: @hey-api/openapi-ts
- **State Management**: React Context
- **Authentication**: JWT + Cookies

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Create reusable components when possible
4. Add proper type definitions
5. Test your changes thoroughly

## 📄 License

See main project LICENSE file.
