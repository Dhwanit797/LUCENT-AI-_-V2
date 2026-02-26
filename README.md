# Business AI — Smart Business Assistant

A demo-ready MVP web app for business insights: expenses, fraud detection, inventory, green grid, health score, AI recommendations, carbon footprint, PDF reports, and an AI chat panel.

## Tech stack

- **Frontend:** React 18, React Router, Recharts, Framer Motion, Three.js (React Three Fiber), Tailwind CSS
- **Backend:** FastAPI, SQLite, SQLAlchemy, JWT (python-jose), passlib, pandas, scikit-learn, reportlab
- **AI/ML:** scikit-learn (IsolationForest, LinearRegression), rule-based logic — no external APIs

## Project structure

```
BusinessAI/
├── backend/
│   ├── core/
│   │   ├── config.py      # Secret, algorithm, DB URL
│   │   └── security.py    # JWT create/decode, password hash, get_current_user
│   ├── models/
│   │   └── user.py        # User model
│   ├── routers/
│   │   ├── auth.py        # POST /auth/login
│   │   ├── expense.py     # /expense/summary, /expense/trends
│   │   ├── fraud.py       # /fraud/insights, /fraud/chart
│   │   ├── inventory.py   # /inventory/summary, /inventory/forecast
│   │   ├── green_grid.py  # /green-grid/data, /green-grid/chart
│   │   ├── health.py      # /health/score
│   │   ├── recommendations.py  # /recommendations
│   │   ├── carbon.py      # /carbon/estimate
│   │   ├── report.py      # GET /report/pdf
│   │   └── chat.py        # POST /chat/message
│   ├── services/
│   │   ├── demo_data.py   # Create tables + demo user
│   │   ├── expense_service.py
│   │   ├── fraud_service.py
│   │   ├── inventory_service.py
│   │   ├── green_grid_service.py
│   │   ├── health_score_service.py
│   │   ├── recommendations_service.py
│   │   ├── carbon_service.py
│   │   ├── report_service.py
│   │   └── chat_service.py
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Card, Hero3D, LoadingSkeleton, chat/ChatPanel
│   │   ├── context/       # AuthContext
│   │   ├── layout/        # Layout, Sidebar
│   │   ├── pages/         # Login, Dashboard, ExpenseSense, FraudLens, SmartInventory, GreenGrid
│   │   ├── services/      # api.ts
│   │   ├── animations/    # pageVariants
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Dependencies

### Backend (`backend/requirements.txt`)

- fastapi, uvicorn
- sqlalchemy
- pydantic
- python-jose[cryptography], passlib[bcrypt]
- pandas, scikit-learn, reportlab

### Frontend (`frontend/package.json`)

- react, react-dom, react-router-dom
- recharts, framer-motion
- three, @react-three/fiber, @react-three/drei
- lucide-react
- tailwindcss, vite, typescript

## How to run

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs  (sometimes it will not work)

# if you get any error run this command - 
# python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000


### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000  

### 3. Demo login

- **Email:** `demo@business.ai`  
- **Password:** `demo123`  

The backend creates this user and the SQLite DB on first run.

## Features

- **Auth:** JWT (1h expiry), protected routes, redirect on invalid token, logout
- **Dashboard:** Health score (circular meter), expense pie chart, AI recommendations, carbon estimate, PDF report download
- **Expense Sense:** Category breakdown, trend, monthly bar chart
- **Fraud Lens:** Anomaly count, risk level, alerts list, daily activity chart
- **Smart Inventory:** Stock levels, reorder suggestions, forecast chart
- **Green Grid:** Usage, peak shift, savings %, recommendations, hourly area chart
- **AI Chat:** Floating button, slide-up panel, typing indicator, rule-based replies

All modules use animated cards, loading skeletons, and Recharts with dark theme. The login page has a 3D hero (Three.js) and a glassmorphic card.
