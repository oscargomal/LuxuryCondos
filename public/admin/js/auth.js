(() => {
  const loginForm = document.getElementById('loginForm');
  const logoutLink = document.querySelector('[data-logout]');

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const initSupabase = async () => {
    const config = await fetchConfig();
    if (!config?.supabaseUrl || !config?.supabaseAnonKey) return null;
    if (!window.supabase) return null;
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  };

  const requireAuth = async (client) => {
    const { data } = await client.auth.getSession();
    if (!data?.session) {
      window.location.href = '/admin/';
    }
  };

  const handleLogin = async (client) => {
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('usuario')?.value.trim();
      const password = document.getElementById('password')?.value.trim();

      if (!email || !password) {
        alert('Completa correo y contrasena.');
        return;
      }

      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        alert('No se pudo iniciar sesion. Verifica tus datos.');
        return;
      }

      window.location.href = '/admin/admin.html';
    });
  };

  const handleLogout = async (client) => {
    if (!logoutLink) return;
    logoutLink.addEventListener('click', async (event) => {
      event.preventDefault();
      await client.auth.signOut();
      window.location.href = '/admin/';
    });
  };

  const boot = async () => {
    const client = await initSupabase();
    if (!client) return;

    if (loginForm) {
      const { data } = await client.auth.getSession();
      if (data?.session) {
        window.location.href = '/admin/admin.html';
        return;
      }
      handleLogin(client);
      return;
    }

    await requireAuth(client);
    handleLogout(client);
  };

  boot();
})();
