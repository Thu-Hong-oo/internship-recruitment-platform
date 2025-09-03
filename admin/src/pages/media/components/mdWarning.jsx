import { Button, Modal } from "antd";
import { getPath } from "../../../utils";

function MdWarning({ open, onCancel }) {
  return (
    <Modal open={open} closable={false} width={350} footer={false} className="warning-modal">
      <div className="flex flex-col items-center justify-center gap-2">
        <img src={getPath("icons/accounts/ic-warning.svg")} width={60} style={{ cursor: "pointer" }} />
        <p className="text-center mt-3 font-semibold text-base">Hình ảnh/video này có liên quan tới bài viết hoặc thông tin khác.</p>
      </div>
      <Button className="btn w-full mt-4" onClick={onCancel}>
        Thoát
      </Button>
    </Modal>
  );
}

export default MdWarning;
