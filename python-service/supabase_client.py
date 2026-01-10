"""
Supabase client for Python service
"""
from supabase import create_client, Client
import os
from typing import Optional


def get_supabase_client() -> Client:
    """
    Create and return Supabase client with service role key.
    Service role key bypasses RLS policies.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Missing Supabase environment variables. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )
    
    return create_client(url, key)

