import React, { useEffect } from 'react';
import { Modal, Button, Input } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

// CSS to override modal white border
const modalStyles = `
  .modal-gray-bg .ant-modal-content {
    background: #f3f4f6 !important;
    border: none !important;
    box-shadow: none !important;
  }
  .modal-gray-bg .ant-modal {
    background: #f3f4f6 !important;
  }
`;

const { TextArea } = Input;

// Preset configurations for common use cases
const PRESETS = {
  'approve-lock': {
    ok: 'Duyệt Khóa',
    cancel: 'Từ chối duyệt',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  },
  'reject-reason': {
    ok: 'Tiếp tục',
    cancel: null,
    iconBg: '#FFE4E6',
    iconColor: '#DC2626',
    titleAlign: 'left',
    singleButton: true
  },
  'confirm-lock': {
    ok: 'Chắc chắn',
    cancel: 'Thoát',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  },
  'lock-reason': {
    ok: 'Tiếp tục',
    cancel: 'Thoát',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  },
  'hide-post': {
    ok: 'Chắc chắn',
    cancel: 'Thoát',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  },
  'confirm-approve': {
    ok: 'Chắc chắn',
    cancel: 'Thoát',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  }
};

export default function ModalPrompt({
  open = false,
  onCancel = () => { },
  onOk = () => { },
  title = '',
  message = '',
  variant,
  okText,
  cancelText,
  okButtonProps = {},
  cancelButtonProps = {},
  showTextarea = false,
  textareaValue = '',
  onChangeTextarea = () => { },
  textareaPlaceholder = 'Nhập nội dung...',
  width = 300,
  textareaWidth = 460,
  centered = true,
  maskClosable = false,
  iconSrc = '/icons/common/notification.svg',
  showOk = true,
  showCancel = true,
  messageColor = '#E16B2F',
}) {
  // Inject CSS for modal styling
  useEffect(() => {
    if (showTextarea) {
      const style = document.createElement('style');
      style.textContent = modalStyles;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [showTextarea]);
  const preset = PRESETS[variant] || {
    ok: 'Xác nhận',
    cancel: 'Thoát',
    iconBg: '#FFF4DB',
    iconColor: '#F59E0B'
  };

  const finalOkText = okText ?? preset.ok;
  const finalCancelText = cancelText ?? preset.cancel;
  const finalWidth = showTextarea ? textareaWidth : width;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={finalWidth}
      centered={centered}
      maskClosable={maskClosable}
      closable={true}
      closeIcon={
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md "  >
          <img src="/icons/common/close.svg" alt="close" />
        </div>
      }
      className={showTextarea ? 'bg-gray-100' : 'bg-white'}
      bodyStyle={{
        padding: 0,
        background: showTextarea ? '#f3f4f6' : '#fff',
        borderRadius: 12,
      }}
      style={{
        overflow: 'hidden',
        background: showTextarea ? '#f3f4f6' : '#fff',
        borderRadius: 12,
      }}
      wrapClassName={showTextarea ? 'modal-gray-bg' : ''}
    >
      <div className={`${showTextarea ? 'bg-gray-100' : 'bg-white'} p-2`}>
        <div className="w-full flex flex-col items-center text-center">

          {!showTextarea && (
            <img src={iconSrc} alt="notice" className="w-16 h-16 mb-6" />
          )}

          {title && (
            <div
              className={`text-black text-[16px] font-bold leading-6 mb-1 ${preset.titleAlign === 'left' ? 'text-left w-full' : 'text-center'
                }`}
            >
              {title}
            </div>
          )}

          {message && (
            <div
              className="text-[14px] leading-6 mb-2 font-bold mt-4"
              style={{ color: messageColor }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}

          {showTextarea && (
            <div className="w-full mt-2">
              <TextArea
                value={textareaValue}
                onChange={(e) => onChangeTextarea(e.target.value)}
                placeholder={textareaPlaceholder}
                autoSize={{ minRows: 4, maxRows: 6 }}
              />
            </div>
          )}

          <div
            className={`w-full gap-2 mt-4 ${preset.singleButton ? 'flex justify-end' : 'grid grid-cols-2'
              }`}
          >
            {showCancel && !preset.singleButton && (
              <Button className="w-full" onClick={onCancel} {...cancelButtonProps}>
                {finalCancelText}
              </Button>
            )}
            {showOk && (
              <Button
                className={preset.singleButton ? 'px-6 py-2' : 'w-full'}
                type="primary"
                onClick={onOk}
                style={{ backgroundColor: 'var(--brand-primary)' }}
                {...okButtonProps}
              >
                {finalOkText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
