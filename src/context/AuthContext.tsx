import React, { createContext, useContext, useState, ReactNode } from "react";
import type { User, UserRole } from "../types";
import {
  mockGuestUser,
  mockContributorUser,
  mockReviewerUser,
  mockAdminUser,
  mockUsers,
} from "../data/mockUsers";

export interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  login: (userOrRole?: UserRole | User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockContributorUser);

  const switchRole = (role: UserRole) => {
    const targetUser = mockUsers.find((u) => u.role === role) || mockGuestUser;
    setCurrentUser(targetUser);
  };

  const login = (userOrRole?: UserRole | User) => {
    if (!userOrRole) {
      setCurrentUser(mockContributorUser);
      return;
    }
    if (typeof userOrRole === "string") {
      switchRole(userOrRole);
    } else {
      setCurrentUser(userOrRole);
    }
  };

  const logout = () => {
    setCurrentUser(mockGuestUser);
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useUser = useAuth;
