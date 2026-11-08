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
  const [cardStyle, setCardStyle] = useState('paper'); // 집중모드 카드 보기 모양: paper(종이 카드) | classic(기존)
  const [themeKey, setThemeKey] = useState('deepsea');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [listFontSize, setListFontSize] = useState('medium');
  const [completedSortOrder, setCompletedSortOrder] = useState('recent');

  // 폰트, TTS 설정
  const [fontType, setFontType] = useState('gothic');
  const [ttsOrder, setTtsOrder] = useState('ref-title-body-ref');
  const [voiceURI, setVoiceURI] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [ttsInterval, setTtsInterval] = useState(0);

  // --- [신규] 오디오 우선순위 설정 ('recording' | 'tts') ---
  const [audioPriority, setAudioPriority] = useState('recording');

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const lastAppState = loadDataFromLocal(LAST_APP_STATE_KEY);
      if (lastAppState && typeof lastAppState === 'object') {
        setMode(lastAppState.mode || 'category');
        setOrder(lastAppState.order || 'sequential');
        setSelectedCategories(lastAppState.selectedCategories || ['전체']);
        setSelectedSubcategories(lastAppState.selectedSubcategories || ['전체']);
        setTargetTurn(lastAppState.targetTurn || 1);
        setTargetTurnForNew(lastAppState.targetTurnForNew || 1);
        setTargetTurnForRecent(lastAppState.targetTurnForRecent || 1);
        setReviewView(lastAppState.reviewView || 'card');
        setCardStyle(lastAppState.cardStyle === 'classic' ? 'classic' : 'paper');
        setFontSize(lastAppState.fontSize || 'medium');
        setListFontSize(lastAppState.listFontSize || 'medium');
        setCompletedSortOrder(lastAppState.completedSortOrder || 'recent');

        setFontType(lastAppState.fontType || 'gothic');
        setTtsOrder(lastAppState.ttsOrder || 'ref-title-body-ref');
        setVoiceURI(lastAppState.voiceURI || null);
        setSpeechRate(lastAppState.speechRate || 1.0);
        setTtsInterval(lastAppState.ttsInterval || 0);
        setAudioPriority(lastAppState.audioPriority || 'recording'); // 로드
      }
      const savedTheme = loadDataFromLocal(THEME_PREFERENCE_KEY);
      if (savedTheme && THEMES[savedTheme.theme]) setThemeKey(savedTheme.theme);
      else setThemeKey('deepsea');

      setIsLoaded(true);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const appStateToSave = {
      mode, order, selectedCategories, selectedSubcategories,
      targetTurn, targetTurnForNew, targetTurnForRecent,
      reviewView, cardStyle, isFocusMode, fontSize, listFontSize, completedSortOrder,
      fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority // 저장
    };
    saveDataToLocal(LAST_APP_STATE_KEY, appStateToSave);
    saveDataToLocal(THEME_PREFERENCE_KEY, { theme: themeKey });
  }, [mode, order, selectedCategories, selectedSubcategories, targetTurn, targetTurnForNew, targetTurnForRecent, reviewView, cardStyle, isFocusMode, fontSize, listFontSize, completedSortOrder, themeKey, fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority, isLoaded]);

  const handleCategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = Array.isArray(value) ? value : [value];
    if (newValues.length === 0 || newValues[newValues.length - 1] === '전체') { setSelectedCategories(['전체']); setSelectedSubcategories(['전체']); return; }
    setSelectedCategories(newValues.filter(item => item !== '전체'));
    setSelectedSubcategories(['전체']);
  };

  const handleSubcategoryChange = (event) => {
    const { target: { value } } = event;
    const newValues = Array.isArray(value) ? value : [value];
    if (newValues.length === 0 || newValues[newValues.length - 1] === '전체') { setSelectedSubcategories(['전체']); return; }
    setSelectedSubcategories(newValues.filter(item => item !== '전체'));
  };

  const value = {
    isLoaded,
    settings: {
      mode, order, selectedCategories, selectedSubcategories,
      targetTurn, targetTurnForNew, targetTurnForRecent,
      reviewView, cardStyle, themeKey, isFocusMode, fontSize, listFontSize, completedSortOrder,
      fontType, ttsOrder, voiceURI, speechRate, ttsInterval, audioPriority // 제공
    },
    setters: {
      setMode, setOrder, setSelectedCategories, handleCategoryChange,
      setSelectedSubcategories, handleSubcategoryChange,
      setTargetTurn, setTargetTurnForNew, setTargetTurnForRecent, setReviewView, setCardStyle, setThemeKey, setIsFocusMode, setFontSize, setListFontSize, setCompletedSortOrder,
      setFontType, setTtsOrder, setVoiceURI, setSpeechRate, setTtsInterval, setAudioPriority // 설정 함수
    },
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};