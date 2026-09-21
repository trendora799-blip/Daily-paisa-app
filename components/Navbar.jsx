const handleLogout = () => {
    if (!confirm('Are you sure you want to logout?')) return;

    // Clear localStorage
    localStorage.removeItem('dailypaisa_user');

    // ✅ Clear the middleware cookie
    document.cookie = 'dailypaisa_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    router.push('/');
  };
