import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import Icon from './Icons';

export const Toast = () => {
  const { toasts, removeToast } = useNotification();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => {
        let iconName = 'alertCircle';
        let typeClass = 'toast-info';

        if (toast.type === 'success') {
          iconName = 'checkCircle';
          typeClass = 'toast-success';
        } else if (toast.type === 'error') {
          iconName = 'alertTriangle';
          typeClass = 'toast-error';
        } else if (toast.type === 'warning') {
          iconName = 'alertTriangle';
          typeClass = 'toast-warning';
        }

        return (
          <div key={toast.id} className={`toast-card ${typeClass}`}>
            <div className="toast-icon">
              <Icon name={iconName} size={20} />
            </div>
            <div className="toast-message">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
