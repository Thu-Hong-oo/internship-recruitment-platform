import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { getPath } from '../utils';

const ToastNotification = ({
  type = 'success',
  title,
  message,
  onClose,
  visible = true
}) => {
  if (!visible) return null;

  const isSuccess = type === 'success';


  const titleColor = isSuccess ? '#067a57' : '#c73a3a';

  const iconSrc = isSuccess ? getPath('/icons/toast/success.svg') : getPath('/icons/toast/fail.svg');

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-sm w-full"
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden'
      }}
    >
      <div className="flex items-start p-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 mr-3"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={iconSrc}
            alt={isSuccess ? 'Success' : 'Error'}
            style={{
              width: '26px',
              height: '26px'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold mb-1"
            style={{ color: titleColor, fontSize: '16px' }}
          >
            {title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed" style={{ fontSize: '12px' }}>
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          style={{ color: '#8c8c8c' }}
        >
          <CloseOutlined style={{ fontSize: '16px' }} />
        </button>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          visible={toast.visible}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
export { ToastNotification };
