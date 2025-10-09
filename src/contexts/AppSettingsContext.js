// src/contexts/AppSettingsContext.js
import React, { createContext, useState, useEffect } from 'react';
import { loadDataFromLocal, saveDataToLocal } from '../api/localStorageApi';
import { LAST_APP_STATE_KEY, THEME_PREFERENCE_KEY, THEMES } from '../constants';

export const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [mode, setMode] = useState('category');
  const [order, setOrder] = useState('sequential');
  const [selectedCategories, setSelectedCategories] = useState(['전체']);
  const [selectedSubcategories, setSelectedSubcategories] = useState(['전체']);
  const [targetTurn, setTargetTurn] = useState(1);
  const [targetTurnForNew, setTargetTurnForNew] = useState(1);
  const [targetTurnForRecent, setTargetTurnForRecent] = useState(1);
  const [reviewView, setReviewView] = useState('card');
  const [themeKey, setThemeKey] = useState('deepsea'); // 기본 테마 변경
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [completedSortOrder, setCompletedSortOrder] = useState('recent');
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const lastAppState = loadDataFromLocal(LAST_APP_STATE_KEY);

      if (lastAppState && typeof lastAppState === 'object' && Object.keys(lastAppState).length > 0) {
        setMode(lastAppState.mode || 'category');
        setOrder(lastAppState.order || 'sequential');
        setSelectedCategories(lastAppState.selectedCategories || ['전체']);
        setSelectedSubcategories(lastAppState.selectedSubcategories || ['전체']);
        setTargetTurn(lastAppState.targetTurn || 1);
        setTargetTurnForNew(lastAppState.targetTurnForNew || 1);
        setTargetTurnForRecent(lastAppState.targetTurnForRecent || 1);
        setReviewView(lastAppState.reviewView || 'card');
        setFontSize(lastAppState.fontSize || 'medium');
        setCompletedSortOrder(lastAppState.completedSortOrder || 'recent');
      }

      const savedTheme = loadDataFromLocal(THEME_PREFERENCE_KEY);
      if (savedTheme && THEMES[savedTheme.theme]) {
        setThemeKey(savedTheme.theme);
      } else {
        setThemeKey('deepsea'); // 기본값 일치
      }
      
      setIsLoaded(true);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const appStateToSave = {
      mode, order, selectedCategories, selectedSubcategories,
      targetTurn, targetTurnForNew, targetTurnForRecent, 
      reviewView, isFocusMode, fontSize, completedSortOrder
    };
    
    saveDataToLocal(LAST_APP_STATE_KEY, appStateToSave);
    saveDataToLocal(THEME_PREFERENCE_KEY, { theme: themeKey });
    
  }, [mode, order, selectedCategories, selectedSubcategories, targetTurn, targetTurnForNew, targetTurnForRecent, reviewView, isFocusMode, fontSize, completedSortOrder, themeKey, isLoaded]);

  const handleCategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = Array.isArray(value) ? value : [value];

    if (newValues.length === 0 || newValues[newValues.length - 1] === '전체') {
      setSelectedCategories(['전체']);
      return;
    }

    const filteredValues = newValues.filter(item => item !== '전체');
    setSelectedCategories(filteredValues);
  };

  const handleSubcategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = Array.isArray(value) ? value : [value];

    if (newValues.length === 0 || newValues[newValues.length - 1] === '전체') {
        setSelectedSubcategories(['전체']);
        return;
    }
    
    const filteredValues = newValues.filter(item => item !== '전체');
    setSelectedSubcategories(filteredValues);
  };

  const value = {
    isLoaded,
    settings: {
      mode, order, selectedCategories, selectedSubcategories,
      targetTurn, targetTurnForNew, targetTurnForRecent, 
      reviewView, themeKey, isFocusMode, fontSize, completedSortOrder,
    },
    setters: {
      setMode, setOrder, setSelectedCategories, handleCategoryChange, 
      setSelectedSubcategories, handleSubcategoryChange,
      setTargetTurn, setTargetTurnForNew, 
      setTargetTurnForRecent, setReviewView, setThemeKey, setIsFocusMode, setFontSize, setCompletedSortOrder,
    },
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};