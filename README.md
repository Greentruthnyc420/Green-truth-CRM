# Green Truth CRM

A comprehensive CRM platform for cannabis brand ambassadors, sales representatives, and dispensary management.

## 🚀 Features

### Sales Representatives
- **Dashboard** - Track performance, points, and upcoming activations
- **Lead Management** - Add and track dispensary leads
- **Sales Logging** - Record sales with product details
- **Shift Tracking** - Log work hours and toll receipts
- **Leaderboard** - Quarterly points competition
- **Deals Hub** - View available brand promotions

### Brand Partners
- **Brand Dashboard** - Overview of sales, activations, and team performance
- **Inventory Management** - Track product levels across dispensaries
- **Activation Scheduling** - Schedule and manage pop-up events
- **Monday.com Integration** - Sync data with Monday.com boards
- **Invoice Management** - Generate and send invoices

### Dispensaries
- **Dispensary Portal** - Manage brand partnerships
- **Order Tracking** - View incoming product orders
- **Invoice Review** - Review and manage invoices from brands

### Admin
- **Team Management** - Manage ambassadors and their assignments
- **Pipeline View** - Track leads through the sales funnel
- **Commission Payouts** - Manage rep compensation
- **System Configuration** - Configure integrations and settings

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Maps**: Google Maps API
- **Integrations**: Monday.com, Gmail SMTP

## 📦 Installation

```bash
# Install dependencies
npm install

# Install function dependencies
cd functions && npm install && cd ..

# Start development server
npm run dev
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## 📁 Project Structure

```
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin-specific pages
│   │   ├── brand/       # Brand partner pages
│   │   ├── dispensary/  # Dispensary portal pages
│   │   └── driver/      # FLX driver pages
│   ├── services/        # API and service functions
│   └── utils/           # Helper utilities
├── functions/           # Firebase Cloud Functions
└── public/              # Static assets
```

## 🔐 User Roles

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access |
| `admin` | Team and operations management |
| `sales_rep` | Sales logging and lead management |
| `brand_admin` | Brand dashboard and team |
| `brand_user` | Brand read-only access |
| `dispensary_admin` | Dispensary management |
| `flx_processor` | FLX delivery operations |

## 📞 Support

For questions or issues, contact: support@thegreentruthnyc.com

---

© 2026 Green Truth NYC. All rights reserved.
