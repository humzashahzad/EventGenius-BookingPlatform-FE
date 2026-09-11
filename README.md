# EventGenius Booking Platform — Frontend

A modern, responsive single-page application for the EventGenius venue booking platform. Built with **Vue 3**, **TypeScript**, and **Tailwind CSS**, featuring real-time chat, role-based portals, and a polished dark/light theme system.

---

## Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| Framework          | Vue 3.5 (Composition API)                       |
| Language           | TypeScript 5.6                                  |
| Build Tool         | Vite 5.4                                        |
| Styling            | Tailwind CSS 3.4 (custom theme + dark mode)     |
| State Management   | Pinia 2.2                                       |
| Routing            | Vue Router 4.4                                  |
| Real-Time          | Laravel Echo + Pusher.js (WebSocket)             |
| HTTP Client        | Axios 1.7 (JWT interceptors)                    |
| Icons              | Lucide Vue Next                                 |
| Date Utilities     | date-fns 4.1                                    |

---

## Features

### Multi-Portal Architecture
Three separate portals, each with its own layout, sidebar, and navigation:

| Portal           | Path             | Purpose                                       |
| ---------------- | ---------------- | --------------------------------------------- |
| **Client**       | `/client/`       | Browse venues, manage bookings, make payments |
| **Store Owner**  | `/store/`        | Manage venues, handle bookings, upload images |
| **Admin Panel**  | `/admin-panel/`  | Oversee users, stores, venues, and sessions   |

### Public Pages
- Landing page with hero section
- Venue browsing with filters
- Detailed venue pages with image galleries and availability calendars
- Public store profiles

### Real-Time Chat (NexusChat)
- Private and group messaging across all portals
- Typing indicators and online presence
- Emoji reactions on messages
- Read receipts with timestamps
- Message editing, deletion, and reply-to
- Sound and browser notifications for new messages
- Connection status monitoring with reconnection

### Notifications
- Real-time delivery via SSE (Server-Sent Events) with polling fallback
- Browser notification permissions
- Unread badge counts in sidebar navigation
- Sound alerts

### Booking Flow
- Interactive booking calendar
- Full booking lifecycle management
- PayFast payment integration (sandbox)
- Payment success/cancel handling

### Dashboard & Analytics
- Role-specific dashboards with key metrics
- Bar charts, line charts, and donut charts
- Booking activity visualization

### Theme System
- Dark / Light / Auto (system preference) modes
- Custom purple/violet primary palette
- Glow effects and gradient backgrounds
- Smooth transitions between themes

---

## Project Structure

```
src/
├── components/
│   ├── booking/           # BookingCalendar
│   ├── charts/            # BarChart, LineChart, DonutChart
│   ├── chat/              # ChatPanel
│   ├── gallery/           # ImageLightbox
│   ├── layout/            # Sidebars, TopBars, PageLayout
│   ├── profile/           # AvatarUpload
│   ├── theme/             # ThemeCustomizer
│   └── ui/                # Base UI components
├── composables/
│   └── useChat.ts         # Chat composable
├── lib/
│   ├── axios.ts           # Axios instance with JWT interceptors
│   ├── echo.ts            # Laravel Echo WebSocket config
│   └── storageUrl.ts      # Storage URL helpers
├── services/
│   └── soundService.ts    # Audio notification service
├── stores/
│   ├── auth.ts            # Authentication state & actions
│   ├── chat.ts            # Real-time chat state
│   ├── notifications.ts   # Notification state & SSE
│   └── theme.ts           # Theme preferences
├── views/
│   ├── auth/              # Login, Register, Password Reset
│   ├── public/            # Home, Venues, VenueDetail
│   ├── client/            # Client dashboard, bookings, payments
│   ├── store/             # Store management views
│   └── admin/             # Admin panel views
├── router/                # Vue Router with role guards
├── App.vue
└── main.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/humzashahzad/EventGenius-BookingPlatform-FE.git
cd EventGeniusBookingPlatform-FE

# Install dependencies
npm install

# Environment setup
cp .env.example .env
```

### Development

```bash
# Start the dev server
npm run dev

# Start with a custom host and port
npm run dev -- --host=192.168.1.100 --port=3000
```

By default the app will be available at `http://localhost:5173`.
With custom host/port it will be at `http://<host>:<port>`.

### Production Build

```bash
# Type-check and build
npm run build

# Preview the production build
npm run preview
```

### Linting & Formatting

```bash
npm run lint       # ESLint with auto-fix
npm run format     # Prettier formatting
```

---

## Environment Variables

| Variable               | Default                          | Description                  |
| ---------------------- | -------------------------------- | ---------------------------- |
| `VITE_API_BASE_URL`    | `http://localhost:8000/api`      | Backend API base URL         |
| `VITE_REVERB_APP_KEY`  | `eventgenius-key`                | WebSocket app key            |
| `VITE_REVERB_HOST`     | `localhost`                      | WebSocket server host        |
| `VITE_REVERB_PORT`     | `8080`                           | WebSocket server port        |
| `VITE_REVERB_SCHEME`   | `http`                           | WebSocket scheme (http/https)|

---

## Design System

### Color Palette

| Color       | Usage                     | Hex       |
| ----------- | ------------------------- | --------- |
| Primary     | Buttons, links, accents   | `#8b5cf6` |
| Secondary   | Highlights, badges        | `#f59e0b` |
| Accent      | Alerts, destructive       | `#f43f5e` |
| Success     | Confirmations             | `#22c55e` |
| Warning     | Caution states            | `#f59e0b` |
| Danger      | Errors, delete actions    | `#ef4444` |
| Info        | Informational             | `#3b82f6` |

### Typography
- **Font:** Inter (system fallback)
- **Dark mode:** Class-based strategy with smooth transitions

---

## License

This project is developed as part of an academic programme.
