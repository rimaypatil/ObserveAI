# ObserveAI Frontend Application

ObserveAI is an AI-powered observability and autonomous Root Cause Analysis (RCA) platform. This frontend application communicates directly with the FastAPI backend (`http://127.0.0.1:8000/api/v1`) through standardized HTTP JSON API envelopes.

---

## 🛠 Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Vanilla Tailwind CSS + Custom Design System tokens
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Data Fetching & Caching**: TanStack Query (React Query) + Axios
- **Charts & Visualizations**: Recharts
- **Topology Graph**: React Flow (`reactflow`)
- **State Management**: React Context (`AuthContext` & `ProjectContext`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- ObserveAI FastAPI Backend running on `http://127.0.0.1:8000`

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in `/frontend`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Running Locally

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📂 Architecture Overview

```text
frontend/
├── src/
│   ├── api/          # Centralized API layer (Axios + standard envelope handling)
│   ├── components/   # Reusable UI, Layout, Incident & AI RCA components
│   ├── context/      # Auth & Active Project state management
│   ├── pages/        # Dashboard, Incidents, IncidentDetail, Services, etc.
│   ├── router/       # React Router configuration & Auth guards
│   ├── mocks/        # Isolated mock adapters (e.g. ServiceMap topology graph)
│   ├── index.css     # Tailwind CSS entry point
│   ├── App.jsx       # Root component & QueryClientProvider
│   └── main.jsx      # Vite entry point
├── package.json
└── vite.config.js
```

---

## 🔒 Security & Key Handling

- **USER JWT TOKEN**: Saved in `localStorage` under `observeai_access_token` and auto-attached as `Authorization: Bearer <access_token>` to protected API requests.
- **SDK API KEYS**: Generated via **Settings > SDK Integration** or Project API keys. The raw key is returned and displayed **ONCE** upon generation for customer application setup.

---

## ⚡ End-to-End Testing Flow

1. Start FastAPI backend (`python -m backend.main` on port 8000).
2. Start Frontend (`npm run dev` on port 3000).
3. Open `http://localhost:3000/register` to create an organization account.
4. Select/Create a Project and generate an SDK Ingestion API Key.
5. Ingest telemetry from `observeai-test-app` or post to `http://127.0.0.1:8000/api/v1/sdk/ingest`.
6. Open **Incidents** -> Select Incident -> View multi-agent AI RCA pipeline execution, evidence cards, confidence breakdown, and recommended fixes.
