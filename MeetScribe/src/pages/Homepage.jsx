import "./Homepage.css"
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  MicIcon,
  VideoIcon,
  StopIcon,
  UploadCloudIcon,
  FileTextIcon,
  ClockIcon,
  DownloadIcon,
  TrashIcon,
} from '../components/icons'
import { authService } from '../lib/authService'