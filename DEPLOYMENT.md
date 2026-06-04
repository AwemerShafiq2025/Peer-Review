# Deployment Guide

## Environment Variables (Add in Vercel Dashboard)

- NVIDIA_API_KEY - your NVIDIA NIM API key
- DATABASE_URL - your Neon PostgreSQL URL
- NEXTAUTH_SECRET - random 32 char string
- NEXTAUTH_URL - your production URL (https://yourapp.vercel.app)
- INIT_DB_SECRET - random secret for DB init route

## After Deploy

1. Visit: https://yourapp.vercel.app/api/init-db with header: x-init-secret: [your INIT_DB_SECRET] (use Postman or curl)
2. This creates the database tables
3. Test registration and login

## curl command for DB init:

```bash
curl -X GET https://yourapp.vercel.app/api/init-db \
  -H "x-init-secret: YOUR_SECRET_HERE"
```
