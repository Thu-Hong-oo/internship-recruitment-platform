import { Button, Input, Modal } from "antd";

function MdInputReason({ reasonModalVisible, setReasonModalVisible, handleNext }) {
  return (
    <Modal
      open={reasonModalVisible?.open}
      // bodyStyle={{ padding: "15px" }}
      onCancel={() => setReasonModalVisible({})}
      title={reasonModalVisible?.type === "lock" ? "Lý do khóa tài khoản" : "Lý do từ chối duyệt"}
      footer={false} 
    >
      <Input.TextArea className="mt-2" rows={4} placeholder="Nhập nội dung..." onChange={(e) => setReasonModalVisible((prev) => ({ ...prev, reason: e.target.value }))} />
      <div className="flex justify-end mt-4">
        <Button className="btn btn-active" disabled={!reasonModalVisible?.reason} onClick={() => handleNext()}>
          Tiếp tục
        </Button>
      </div>
    </Modal>
  );
}

export default MdInputReason;
