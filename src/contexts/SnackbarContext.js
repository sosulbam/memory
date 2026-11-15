// src/contexts/SnackbarContext.js
import React, { createContext, useState, useCallback, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { IS_LAMP } from '../edition';

export const SnackbarContext = createContext(null);

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'error', 'warning', 'info', 'success'
  });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        // 등불판: 집중 모드 아래 단추줄(외웠어요·다시)을 가리지 않게 그만큼 올린다
        sx={{ mb: IS_LAMP ? 'calc(76px + var(--sab))' : 'var(--sab)' }}
      >
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};