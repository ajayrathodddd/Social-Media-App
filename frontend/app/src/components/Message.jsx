import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

function Message({ variant = 'info', children, onClose }) {
  useEffect(() => {
    // Only set auto-dismiss timer if onClose function is provided
    if (typeof onClose === 'function') {
      const timer = setTimeout(() => {
        onClose();
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [onClose]);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Alert
      variant={variant}
      dismissible={typeof onClose === 'function'}
      onClose={handleClose}
    >
      {children}
    </Alert>
  );
}

export default Message;