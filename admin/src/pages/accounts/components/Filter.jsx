import { Button, Form, Input, Select, TreeSelect } from "antd";
import React from "react";
// import { getPath } from "../../../utils";

function Filter({ formData, setFormData }) {
  const [form] = Form.useForm();
  const formRef = React.createRef();

  const onFinish = () => {
    form
      .validateFields()
      .then(async (values) => {
        setFormData({ ...formData, ...values, page: 1 });
      })
      .catch(() => {});
  };

  return (
    <>
      <div style={{ margin: "20px 0" }}>
        <Form
          ref={formRef}
          layout={"vertical"}
          scrollToFirstError
          form={form}
          onFinish={onFinish}
          onValuesChange={(_, allValues) => {
            const normalized = {
              ...allValues,
              role: allValues?.role ?? undefined,
              status: allValues?.status ?? undefined,
            };
            setFormData({ ...formData, ...normalized, page: 1 });
          }}
          autoComplete="off"
          initialValues={{
            role: formData?.role ?? null,
            status: formData?.status ?? null,
            fullname: formData?.fullname,
            phone: formData?.phone,
            email: formData?.email,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <Form.Item
              style={{ marginBottom: 0, flex: 1 }}
              name="fullname"
              rules={[
                {
                  required: false,
                  message: "Vui lòng nhập thông tin.",
                },
              ]}
            >
              <Input
                className="custom-input"
                allowClear
                placeholder="Tìm theo họ & tên"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              style={{ marginBottom: 0, flex: 1 }}
              name="phone"
              rules={[
                {
                  required: false,
                  message: "Vui lòng nhập thông tin.",
                },
              ]}
            >
              <Input
                className="custom-input"
                allowClear
                placeholder="Tìm theo số điện thoại"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              style={{ marginBottom: 0, flex: 1 }}
              name="email"
              rules={[
                {
                  required: false,
                  message: "Vui lòng nhập thông tin.",
                },
              ]}
            >
              <Input
                className="custom-input"
                allowClear
                placeholder="Email"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item name="role" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Role"
                allowClear
                style={{ width: 160 }}
                options={[
                  { label: "Tất cả", value: null },
                  { label: "Người tìm viêc", value: "student" },
                  { label: "Nhà tuyển dụng", value: "employer" },
                  { label: "Admin", value: "admin" },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: 160 }}
                options={[
                  { label: "Tất cả", value: null },
                  { label: "Đang hoạt động", value: "active" },
                  { label: "Chưa kích hoạt", value: "inactive" },
                ]}
              />
            </Form.Item>
            {/* Nút tìm kiếm đã được bỏ; lọc áp dụng tự động qua onValuesChange */}
          </div>
        </Form>
      </div>
    </>
  );
}

export default Filter;
