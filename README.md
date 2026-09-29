# MeetScribe
ICT308 Project 2 - AI-powered transcript web application 

Website is live at: https://meetscribe-xnud.onrender.com/

## Overview

MeetScribe is a React + Vite single-page app backed by Supabase (auth, Postgres, file storage, and a scheduled edge function) and a small Node/Express server that talks to the AI services. Users sign up or log in, then upload or record meetings from the Dashboard, browse them on the Files page, and open any file to see a speaker-labelled transcript (AssemblyAI) plus an AI-generated summary (Gemini). The Settings page lets users manage their account, including changing their password under strong password rules and deleting their account, while uploaded media automatically expires and is cleaned up after a retention period.











#Initialization

npm install @supabase/supabase-js
npm install supabase --save-dev
npx supabase init

npx supabase start
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
