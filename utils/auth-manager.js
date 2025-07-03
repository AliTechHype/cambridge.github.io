// Authentication Manager
const authManager = {
  // Auth data structure
  authData: {
    users: [],
    sessions: [],
    passwordResetTokens: [],
  },

  // Initialize auth manager
  init() {
    this.loadAuthData();
    this.cleanupExpiredSessions();
  },

  // Load auth data from localStorage
  loadAuthData() {
    const stored = localStorage.getItem("authData");
    if (stored) {
      this.authData = JSON.parse(stored);
    } else {
      // Initialize with default admin user
      this.authData = {
        users: [
          {
            id: 1,
            email: "admin@medicare.com",
            password: "admin123",
            name: "Admin User",
            role: "admin",
            createdAt: "2024-01-01T00:00:00.000Z",
            lastLogin: null,
          },
        ],
        sessions: [],
        passwordResetTokens: [],
      };
      this.saveAuthData();
    }
  },

  // Save auth data to localStorage
  saveAuthData() {
    localStorage.setItem("authData", JSON.stringify(this.authData));
  },

  // Login function
  async login(email, password) {
    const user = this.authData.users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Create session with 7 days expiration
      const session = {
        id: Date.now(),
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      this.authData.sessions.push(session);

      // Update last login
      user.lastLogin = new Date().toISOString();

      this.saveAuthData();

      // Set current session ID
      this.setCurrentSession(session.id);

      return true;
    } else {
      throw new Error("Invalid email or password");
    }
  },

  // Logout function
  logout() {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      this.authData.sessions = this.authData.sessions.filter(
        (s) => s.id !== currentSession.id
      );
      this.saveAuthData();
    }
    localStorage.removeItem("currentSessionId");
  },

  // Get current session
  getCurrentSession() {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId) return null;

    const session = this.authData.sessions.find(
      (s) => s.id === parseInt(sessionId)
    );
    if (!session) return null;

    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      this.logout();
      return null;
    }

    return session;
  },

  // Get current user
  getCurrentUser() {
    const session = this.getCurrentSession();
    if (!session) return null;

    return this.authData.users.find((u) => u.id === session.userId);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return this.getCurrentSession() !== null;
  },

  // Validate current password
  validateCurrentPassword(password) {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.password === password;
  },

  // Validate password for any user by email
  validatePasswordByEmail(email, password) {
    const user = this.authData.users.find((u) => u.email === email);
    if (!user) return false;

    return user.password === password;
  },

  // Reset password
  async resetPassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("No user found");
    }

    if (user.password !== currentPassword) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;

    // Clear all sessions to force re-login
    this.authData.sessions = [];
    localStorage.removeItem("currentSessionId");

    this.saveAuthData();

    return true;
  },

  // Reset password by email
  async resetPasswordByEmail(email, currentPassword, newPassword) {
    const user = this.authData.users.find((u) => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.password !== currentPassword) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;

    // Clear all sessions for this user to force re-login
    this.authData.sessions = this.authData.sessions.filter(
      (s) => s.userId !== user.id
    );
    localStorage.removeItem("currentSessionId");

    this.saveAuthData();

    return true;
  },

  // Create password reset token
  createPasswordResetToken(email) {
    const user = this.authData.users.find((u) => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    const token = {
      id: Date.now(),
      userId: user.id,
      email: email,
      token:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    };

    this.authData.passwordResetTokens.push(token);
    this.saveAuthData();

    return token.token;
  },

  // Validate password reset token
  validatePasswordResetToken(token) {
    const resetToken = this.authData.passwordResetTokens.find(
      (t) => t.token === token
    );
    if (!resetToken) return false;

    // Check if token is expired
    if (new Date() > new Date(resetToken.expiresAt)) {
      this.authData.passwordResetTokens =
        this.authData.passwordResetTokens.filter((t) => t.token !== token);
      this.saveAuthData();
      return false;
    }

    return true;
  },

  // Reset password with token
  async resetPasswordWithToken(token, newPassword) {
    const resetToken = this.authData.passwordResetTokens.find(
      (t) => t.token === token
    );
    if (!resetToken) {
      throw new Error("Invalid or expired token");
    }

    const user = this.authData.users.find((u) => u.id === resetToken.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update password
    user.password = newPassword;

    // Remove used token
    this.authData.passwordResetTokens =
      this.authData.passwordResetTokens.filter((t) => t.token !== token);

    this.saveAuthData();
    return true;
  },

  // Register new user
  async register(email, password, name) {
    // Check if user already exists
    const existingUser = this.authData.users.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      email: email,
      password: password,
      name: name,
      role: "user",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    this.authData.users.push(newUser);
    this.saveAuthData();

    return newUser;
  },

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    this.authData.sessions = this.authData.sessions.filter((session) => {
      return new Date(session.expiresAt) > now;
    });

    this.authData.passwordResetTokens =
      this.authData.passwordResetTokens.filter((token) => {
        return new Date(token.expiresAt) > now;
      });

    this.saveAuthData();
  },

  // Check authentication on page load
  checkAuth() {
    if (!this.isAuthenticated()) {
      // Redirect to login if not authenticated
      if (
        window.location.pathname !== "/login.html" &&
        window.location.pathname !== "/forgot-password.html" &&
        window.location.pathname !== "/register.html" &&
        !window.location.pathname.endsWith("login.html") &&
        !window.location.pathname.endsWith("forgot-password.html") &&
        !window.location.pathname.endsWith("register.html")
      ) {
        window.location.href = "login.html";
      }
    } else {
      // Redirect to main page if already authenticated
      if (
        window.location.pathname === "/login.html" ||
        window.location.pathname === "/register.html" ||
        window.location.pathname.endsWith("login.html") ||
        window.location.pathname.endsWith("register.html")
      ) {
        window.location.href = "index.html";
      }
    }
  },

  // Set current session
  setCurrentSession(sessionId) {
    localStorage.setItem("currentSessionId", sessionId);
  },
};

// Initialize auth manager when script loads
authManager.init();

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = authManager;
}
