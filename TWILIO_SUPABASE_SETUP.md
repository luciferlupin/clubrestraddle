# Twilio Phone SMS Verification Setup Guide

This guide walks you through enabling **Twilio SMS Phone Verification** (with Alphanumeric Sender ID / Messaging Service) directly in your **Supabase Project** for Club Re Straddle.

---

## 1. Prerequisites
1. A **Supabase** account and project ([https://supabase.com](https://supabase.com)).
2. A **Twilio** account ([https://www.twilio.com](https://www.twilio.com)) with an active Messaging Service or Alphanumeric Sender ID.

---

## 2. Twilio Credentials Setup

Configure these credentials in your Supabase Dashboard:

- **Twilio Account SID**: `YOUR_TWILIO_ACCOUNT_SID` (e.g. `AC...`)
- **Twilio Auth Token**: `YOUR_TWILIO_PRIMARY_AUTH_TOKEN`
- **Twilio Messaging Service SID / Alphanumeric Sender**: `YOUR_TWILIO_MESSAGING_SERVICE_SID` (e.g. `MG...` or Alphanumeric Sender ID)

---

## 3. Configure Twilio in Supabase Dashboard

1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard/projects)**.
2. In the left navigation sidebar, click **Authentication** > **Providers**.
3. Find **Phone** in the list and click to expand it.
4. Set the following fields:
   - **Enable Phone Provider**: Toggle **ON** (Enabled)
   - **SMS Provider**: Select **Twilio**
   - **Twilio Account SID**: Paste your Account SID (`AC...`)
   - **Twilio Auth Token**: Paste your Primary Auth Token
   - **Twilio Message Service SID / Phone Number**: Paste your `MG...` Messaging Service SID or Alphanumeric Sender ID
   - **SMS OTP Expiration**: `300` (5 minutes)
5. Click **Save** at the bottom right.

---

## 4. How the App Dispatches SMS OTP

1. **Player Registration / Pass Lookup**:
   - Player enters mobile number (`+91 98765 43210`).
   - Clicks **Verify Mobile via SMS**.
   - App dispatches a 6-digit OTP code to the player's phone via Twilio SMS Gateway & Supabase.
   - Player inputs the 6-digit OTP code.
   - Upon verification, the profile is marked with `phone_verified: true` and `phone_verified_at: NOW()`.

