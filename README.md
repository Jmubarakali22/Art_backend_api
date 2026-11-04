# Ar Rahman Trust - Admin Backend API

Official Node.js & Express REST API backend for the Ar Rahman Trust Charity Admin Management System.

## Features
- **Authentication**: JWT-based Admin Authentication with bcrypt password hashing
- **Database**: MySQL / TiDB Cloud Serverless with TLS/SSL encryption & automatic schema initialization
- **Donation Management**: Online and manual donations, Zakat/Sadaqah tracking, official PDF receipt generation
- **Causes & Welfare Programs**: CRUD management with ImageKit CDN media support
- **Gallery**: Multi-category charity activity photos powered by ImageKit CDN
- **Volunteers & Contacts**: Application verification, status tracking, email notification
- **Direct WhatsApp Engine**: Integrated Baileys connection for background receipt delivery

## Tech Stack
- Node.js (v18+)
- Express.js
- MySQL2 (with Promise & Pool support)
- PDFKit & html2pdf compatibility
- ImageKit Node.js SDK
- Baileys (@whiskeysockets/baileys)
- Helmet & CORS

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in your MySQL / TiDB credentials:
   ```bash
   cp .env.example .env
   ```

3. **Initialize Database**
   Creates all tables and seeds default admin credentials (`admin` / `password123`):
   ```bash
   npm run seed
   ```

4. **Start Server**
   ```bash
   npm start
   ```
   Or with nodemon for development:
   ```bash
   npm run dev
   ```

## Production Deployment (Render)
- **Root Directory**: `backend` (or root if repository contains only backend)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Add environment variables as documented in `.env.example`.
