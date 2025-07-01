// Auth System with Auto-Login
    const auth = {
      currentUser: null,
      userData: null,
      
      init() {
        this.loadUser();
        return this;
      },
      
      loadUser() {
        const userData = localStorage.getItem('wheelGameUser');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            this.currentUser = parsed.name;
            this.userData = parsed;
            return true;
          } catch (e) {
            localStorage.removeItem('wheelGameUser');
          }
        }
        return false;
      },
      
      async login(name) {
        try {
          const res = await fetch(`${API_BASE}/player/${name}`);
          if (!res.ok) throw new Error('Login failed');
          
          const userData = await res.json();
          localStorage.setItem('wheelGameUser', JSON.stringify(userData));
          this.currentUser = name;
          this.userData = userData;
          return userData;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
      
      logout() {
        localStorage.removeItem('wheelGameUser');
        this.currentUser = null;
        this.userData = null;
      },
      
      isAuthenticated() {
        return !!this.currentUser;
      }
    }.init();
