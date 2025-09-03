import { Modal, Form, Input, Select, Button } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { getPath } from "../../../utils";

const ModalDetail = ({ open, onCancel, onOk, initialValues }) => {
  const [form] = Form.useForm();

  return (
    <Modal title="Sửa thông tin kho hình ảnh/Video" open={open} onCancel={onCancel} footer={null} centered className="rounded-2xl">
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onOk} autoComplete="off">
        <Form.Item label="Tên hình ảnh" name="name">
          <Input placeholder="Nhập tên hình ảnh" />
        </Form.Item>

        <Form.Item label="Danh mục" name="category">
          <Select
            placeholder="Chọn danh mục"
            options={[
              { value: "bao-hiem-1", label: "Bảo hiểm A1" },
              { value: "bao-hiem-2", label: "Bảo hiểm A2" },
              { value: "khac", label: "Khác" },
            ]}
          />
        </Form.Item>

        <div className="flex justify-between gap-3 mt-6">
          <Button onClick={onCancel} className="bg-[#E6EBF2] border-none w-1/2">
                    <img src={getPath("/icons/common/double-back.svg")} alt="back" />
                    Quay lại
                  </Button>
          <Button type="primary" htmlType="submit" className="flex-1 bg-blue-900 text-white">
            Xác nhận
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModalDetail;
