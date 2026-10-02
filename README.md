# PARxCON Ops — Internal Operations & Command Center (V1)

PARxCON Ops is a self-hostable, private internal web application built for operational governance, sales pipeline tracking, client management, collections tracking, automated follow-ups, and an AI-driven operations command assistant.

---

## 🚀 Key Modules & Capabilities

1. **Dashboard Overview**: Executive KPIs (monthly revenue, weighted pipeline, outstanding receivables, active deals), today's scheduled follow-ups, stage breakdown, and impending renewals.
2. **Lead Management**: Capture, qualify, and track leads across 10 sources (LinkedIn, IndiaMART, Referral, etc.) with 1-click conversion into active client engagements and commercial proposals.
3. **Sales & Deals Pipeline**: Real-time stage velocity tracking (Discovery, Requirement, Proposal, Negotiation, Verbal Confirmation, Won, Lost) with automatic weighted pipeline calculations (`Deal Value × Probability`).
4. **Client Management (Consolidated 360° View)**: Consolidated client dossier linking Leads, Deals, Projects, Tasks, Follow-ups, Invoices, Payments, Documents, and Account references.
5. **Payment & Receivables Management**: Tracks invoices and settlements. Automatically derives pending amount (`Invoice Amount - Total Received Payments`) with overdue flags.
6. **Task & Follow-up Engine**: Priority task delegation and touchpoint logging (Call, Email, WhatsApp, Meeting) with outcome records and automated scheduling.
7. **Account Registry (Zero-Plaintext Policy)**: Maintains external service references (AWS, Cloudflare, Google Workspace, Razorpay) pointing to Bitwarden/1Password vaults. **Never stores plaintext passwords in the database.**
8. **Renewal Alerts Watchdog**: Monitors domains, SSL certificates, SaaS subscriptions, and client contracts with 30, 15, 7, and 1-day alert intervals.
9. **Ops Assistant AI**: Controlled backend tool-calling engine for natural-language instructions (e.g., *"XYZ paid 25k today"*, *"Add a new lead from LinkedIn"*, *"Who owes us money?"*, *"What do I need to follow up today?"*).
10. **Automation Engine**: Automated morning operational briefings, evening sales digests, weekly analytics, and stale opportunity detection (> 7 days inactivity).
11. **Security & RBAC**: Role-based access control (Admin, Manager, Employee) enforced on the backend with an immutable audit log for all mutations.
12. **Import / Export**: CSV export for deals, clients, payments, and tasks (sanitized: credentials excluded).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js, Express, TypeScript (ES Modules)
- **Database**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`)
- **Authentication**: JWT & secure HTTP-only cookies, Bcrypt password hashing
- **AI Engine**: `@google/genai` (Gemini 3.8 Flash) with safe controlled backend tool execution + high-speed deterministic NLP matcher
- **Deployment**: Docker, Docker Compose, Nginx/Caddy reverse-proxy ready

---

## 🔑 Pre-configured Development Test Credentials

The system includes pre-seeded operational accounts with varying RBAC roles:

| Role | Email | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@parxcon.com` | `admin123` | Full access to users, settings, delete operations, and audit logs |
| **Manager** | `manager@parxcon.com` | `manager123` | Sales pipeline, client accounts, reports, and task delegation |
| **Employee** | `faisal@parxcon.com` | `faisal123` | Assigned leads, allocated deals, and daily operational follow-ups |

*Note: You can also switch roles with 1 click in the top navigation bar during development.*

---

## 💻 Quickstart (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/parxcon/parxcon-ops.git
cd parxcon-ops
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🐳 Production Deployment with Docker Compose

Deploy the entire full-stack application, PostgreSQL database, and automated backup daemon in one command:

```bash
# 1. Clone repository on your VPS (Ubuntu 22.04 / 24.04 LTS recommended)
git clone https://github.com/parxcon/parxcon-ops.git /opt/parxcon-ops
cd /opt/parxcon-ops

# 2. Copy and customize production environment
cp .env.example .env
nano .env

# 3. Start production containers in background
docker compose up -d --build
```

The services will start automatically:
- `parxcon-ops-app`: Web Application on port `3000`
- `parxcon-postgres`: PostgreSQL 16 database on port `5432`
- `parxcon-postgres-backup`: Automated daily database backup service

---

## 🗄️ PostgreSQL Database Migrations (Prisma)

When connecting to an external PostgreSQL database or after modifying `prisma/schema.prisma`:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or run standard migration workflow
npx prisma migrate dev --name init
```

---

## 💾 Database Backup & Disaster Recovery

### Manual Backup (`pg_dump`)
```bash
docker exec -t parxcon-postgres pg_dump -U postgres parxcon_ops > parxcon_ops_backup_$(date +%F).sql
```

### Database Restoration (`psql`)
```bash
cat parxcon_ops_backup.sql | docker exec -i parxcon-postgres psql -U postgres -d parxcon_ops
```

### Automated Backup Retention
The included `postgres-backup` service runs daily at midnight and maintains:
- 14 daily backups
- 4 weekly backups
- 6 monthly backups
Stored in `./backups`.

---

## 🌐 Production VPS Nginx Configuration

Put Nginx in front of port 3000 with Let's Encrypt SSL:

```nginx
server {
    listen 80;
    server_name ops.parxcon.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ops.parxcon.com;

    ssl_certificate /etc/letsencrypt/live/ops.parxcon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ops.parxcon.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛡️ Security Guarantees

1. **Zero-Plaintext Secret Policy**: External passwords (AWS, Cloudflare, Google, Razorpay) are **never stored** in the application database. Only vault item references (Bitwarden/1Password) are maintained.
2. **Controlled AI Execution**: The Ops Assistant does not have direct arbitrary SQL execution privileges. All mutations run through authenticated, validated backend functions.
3. **Confirmation for Destructive Actions**: Permanent deletions require explicit user confirmation.
4. **Bcrypt Password Hashing**: Passwords stored using 10-round salted Bcrypt hashes.
