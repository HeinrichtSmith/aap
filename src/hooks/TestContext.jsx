import React, { createContext, useContext, useState } from 'react';

const TestContext = createContext();

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within TestProvider');
  }
  return context;
};

export const TestProvider = ({ children }) => {
  const [user, setUser] = useState({ name: 'Test User' });

  return (
    <TestContext.Provider value={{ user }}>
      {children}
    </TestContext.Provider>
  );
};