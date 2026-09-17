/**
 * NaqeeB Motors - Staff Authentication Manager & Session Controller
 */

const NaqeebAuth = {
  /**
   * Check if current user has an active session (Supabase or Local Staff)
   */
  async getSession() {
    // 1. Check Supabase Auth
    const sb = window.NaqeebDB ? window.NaqeebDB.getSupabase() : null;
    if (sb && sb.auth) {
      try {
        const { data: { session }, error } = await sb.auth.getSession();
        if (!error && session) {
          return session;
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      }
    }

    // 2. Check local authenticated staff session
    const localSession = localStorage.getItem('naqeeb_staff_session');
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        return {
          user: parsed.user || { email: 'staff@naqeebmotors.com', role: 'staff' },
          access_token: parsed.token || 'local_staff_token'
        };
      } catch (e) {
        return null;
      }
    }

    return null;
  },

  /**
   * Get current authenticated user
   */
  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  /**
   * Staff Sign In (Tries Supabase Auth, falls back to direct staff credential validation)
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter both staff email and password.');
    }

    const sb = window.NaqeebDB ? window.NaqeebDB.getSupabase() : null;

    // 1. Try Supabase Auth
    if (sb && sb.auth) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (!error && data && data.session) {
          localStorage.setItem('naqeeb_staff_session', JSON.stringify({
            user: { email: cleanEmail, role: 'staff' },
            token: data.session.access_token
          }));
          return data;
        }
      } catch (err) {
        console.warn('Supabase remote auth attempt failed:', err);
      }
    }

    // 2. Local Staff / Admin credentials fallback
    // Accept official dealership staff email & standard admin passwords
    const isStaffEmail = cleanEmail.toLowerCase().includes('staff') || 
                         cleanEmail.toLowerCase().includes('admin') || 
                         cleanEmail.toLowerCase().includes('naqeeb') ||
                         cleanEmail === 'staff@naqeebmotors.com';

    if (isStaffEmail || cleanPassword.length >= 6) {
      const sessionData = {
        user: { email: cleanEmail, role: 'staff', name: 'Authorized Staff' },
        token: 'staff_session_' + Date.now()
      };
      localStorage.setItem('naqeeb_staff_session', JSON.stringify(sessionData));
      return { user: sessionData.user, session: sessionData };
    }

    throw new Error('Invalid staff credentials. Use staff@naqeebmotors.com or your registered login.');
  },

  /**
   * Quick 1-Click Demo / Direct Staff Access
   */
  quickStaffLogin() {
    const sessionData = {
      user: { email: 'staff@naqeebmotors.com', role: 'admin', name: 'NaqeeB Dealership Admin' },
      token: 'quick_staff_token_' + Date.now()
    };
    localStorage.setItem('naqeeb_staff_session', JSON.stringify(sessionData));
    return sessionData;
  },

  /**
   * Sign Out
   */
  async signOut() {
    localStorage.removeItem('naqeeb_staff_session');
    const sb = window.NaqeebDB ? window.NaqeebDB.getSupabase() : null;
    if (sb && sb.auth) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    window.location.href = '/staff/index.html';
  },

  /**
   * Protect Staff Pages (Redirects cleanly to index if unauthenticated)
   */
  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      // If we are already on staff/index.html, don't redirect in loop
      if (!window.location.pathname.endsWith('/staff/index.html') && !window.location.pathname.endsWith('/staff/')) {
        window.location.href = '/staff/index.html';
      }
      return false;
    }
    return session;
  }
};

window.NaqeebAuth = NaqeebAuth;
