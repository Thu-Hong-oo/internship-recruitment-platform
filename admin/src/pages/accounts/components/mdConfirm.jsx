import { Button, Modal } from "antd";
import { getPath } from "../../../utils";

function MdConfirm({ open, handleCancel, type, handleRefuse, handleApprove }) {
  return (
    <Modal open={open} onCancel={handleCancel} closable={true} width={350} footer={false} >
      <div className="flex flex-col items-center justify-center gap-2">
        <img src={getPath("icons/accounts/ic-warning.svg")} width={60} style={{ cursor: "pointer" }} />
        <p className="text-center mt-4 font-semibold text-base">
          Bạn có chắc chắn {type === "approve-active" ? "duyệt" : "duyệt khóa"} tài khoản này không?
        </p>
        {type === "approve-lock" && <p className="text-center mt-1 font-semibold text-[#E16B2F]">Lý do ẩn: Người dùng spam đánh giá bài viết bẩn</p>}
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <Button className="btn w-[50%]" onClick={() => handleRefuse()}>
          Từ chối duyệt
        </Button>
        <Button className="btn btn-active w-[50%]" onClick={() => handleApprove()}>
          {type === "approve-active" ? "Duyệt bài" : "Duyệt khóa"}
        </Button>
      </div>
    </Modal>
  );
}

export default MdConfirm;
