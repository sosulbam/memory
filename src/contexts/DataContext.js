// src/contexts/DataContext.js
import React, { createContext } from 'react';
import { useVerseData } from '../hooks/useVerseData';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const verseData = useVerseData();

  return (
    <DataContext.Provider value={verseData}>
      {children}
    </DataContext.Provider>
  );
};