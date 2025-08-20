# Sancura - Complete Hospital OPD Platform

**Formerly MediQueue** - A comprehensive hospital-grade OPD management system that transforms patient flow into a seamless digital experience.

## 🏥 Vision

To transform hospital OPD & clinical flows into a seamless, patient-first digital experience. Sancura evolves from a simple queue system into a complete hospital-grade OPD platform with appointments, billing, history, and analytics — all while keeping reliability, speed, and usability at the core.

## ✨ Features

### Core System (Production Ready)
- **Walk-in Registration** - Instant patient registration without signup
- **Smart Queue Management** - Real-time token system per doctor/department
- **Live Updates** - WebSocket-powered real-time synchronization
- **Doctor Console** - Complete consultation interface with voice notes
- **Admin Dashboard** - Comprehensive monitoring and management
- **QR Code System** - Contactless check-in and patient tracking

### Advanced Features
- **Appointment Scheduling** - Book appointments in advance with slot management
- **Doctor Availability** - Flexible scheduling and capacity management
- **Integrated Billing** - Simple billing system with PDF receipts
- **Smart Notifications** - Web-based patient engagement system
- **Multi-Department Support** - Hospital-wide deployment capability
- **Patient History** - Mini-EMR with visit history and medical records
- **Analytics & Reports** - Comprehensive insights and reporting

## 🚀 Quick Start

1. **Clone and Setup**:
   ```bash
   git clone <your-repo>
   cd sancura
   npm install
   ```

2. **Database Setup**:
   - Create a Supabase project
   - Click "Connect to Supabase" in the top right
   - Database schema will be applied automatically

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **Supabase Client** for backend integration
- **Real-time WebSockets** for live updates

### Backend Stack
- **Supabase** (PostgreSQL + Realtime + Auth)
- **Row Level Security** for data protection
- **Edge Functions** for serverless operations
- **Real-time subscriptions** for live updates

### Key Components
- **Patient Portal** - Registration, queue tracking, appointments
- **Doctor Console** - Consultation management, prescriptions, voice notes
- **Admin Dashboard** - System monitoring, settings, analytics
- **Billing System** - Payment processing, receipts, financial tracking

## 📊 Database Schema

### Core Entities
- **Patients** - Patient profiles with permanent UIDs
- **Visits** - Visit records with token numbers and status
- **Doctors** - Doctor profiles with availability and specializations
- **Departments** - Hospital departments with configurations
- **Appointments** - Scheduled appointments with slot management
- **Medical History** - Patient medical records and prescriptions
- **Payment Transactions** - Billing and payment tracking

## 🔧 Configuration

### Department Setup
Configure departments in Admin → Settings → Departments:
```typescript
{
  name: 'cardiology',
  display_name: 'Cardiology',
  consultation_fee: 800,
  average_consultation_time: 20,
  color_code: '#EF4444'
}
```

### Doctor Availability
Set doctor schedules and capacity:
```typescript
{
  available_days: ['monday', 'tuesday', 'wednesday'],
  available_hours: { start: '09:00', end: '17:00' },
  max_patients_per_day: 50
}
```

## 🔐 Security Features

- **Row-level security** on all database tables
- **Encrypted QR payloads** prevent tampering
- **Audit logging** for all admin actions
- **Rate limiting** and input validation
- **Secure authentication** with Supabase Auth

## 📱 Multi-Platform Support

- **Web Application** - Full-featured web interface
- **Mobile Responsive** - Optimized for all devices
- **PWA Ready** - Installable web app
- **Offline Capable** - Basic functionality without internet

## 🎯 Deployment Options

### Supported Platforms
- **Vercel** (Recommended)
- **Netlify**
- **Any static hosting** with SPA support

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📈 Analytics & Insights

- **Real-time dashboards** with live metrics
- **Patient flow analytics** and wait time optimization
- **Revenue tracking** and financial reports
- **Doctor performance** metrics
- **Department utilization** analysis

## 🔄 Expansion Roadmap

### Phase 1: Enhanced Appointments ✅
- Advanced slot management
- Recurring appointments
- Appointment reminders

### Phase 2: Advanced Billing ✅
- Insurance integration
- Payment plans
- Financial reporting

### Phase 3: Enhanced EMR
- Detailed medical records
- Lab integration
- Prescription management

### Phase 4: Multi-Location
- Hospital chain support
- Cross-location referrals
- Centralized reporting

## 🛠️ Development

### Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── hooks/         # Custom React hooks
├── lib/           # Utilities and configurations
├── types/         # TypeScript type definitions
└── styles/        # Global styles and themes
```

### Key Technologies
- **TypeScript** for type safety
- **React Hooks** for state management
- **Tailwind CSS** for styling
- **Supabase** for backend services
- **React Router** for navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided for educational and commercial use.

## 🏆 Credits

Developed by **Aftab Alam** [ASOSE Lajpat Nagar]
- Instagram: [@aftabxplained](https://instagram.com/aftabxplained)
- Transforming healthcare through technology

---

**Sancura** - Where healthcare meets innovation 🏥✨