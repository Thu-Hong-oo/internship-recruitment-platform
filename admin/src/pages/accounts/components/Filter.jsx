import { Button, Form, Input, Select, TreeSelect } from "antd";
import React from "react";
import { getPath } from "../../../utils";

function Filter({ config, formData, setFormData }) {
  const [form] = Form.useForm();
  const formRef = React.createRef();

  const onFinish = (val) => {
    form
      .validateFields()
      .then(async (values) => {
        setFormData({ ...formData, ...values, page: 1 });
      })
      .catch((err) => {});
  };

  return (
    <>
      <div style={{ margin: "20px 0" }}>
        <Form ref={formRef} layout={"vertical"} scrollToFirstError form={form} onFinish={onFinish} autoComplete="off">
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
            <Input className="custom-input" allowClear placeholder="Tìm theo họ & tên" style={{ width: "100%" }} />
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
            <Input className="custom-input" allowClear placeholder="Tìm theo số điện thoại" style={{ width: "100%" }} />
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
            <Input className="custom-input" allowClear placeholder="Email" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name={"status"}
            style={{ margin: 0, flex: 1 }}
            rules={[
              {
                required: false,
                message: "Vui lòng chọn thông tin",
              },
            ]}
          >
            <TreeSelect
              allowClear
              multiple
              showSearch={false}
              treeCheckable={true}
              className="custom-Treeselect"
              popupClassName="custom-popup-treeselect"
              maxTagCount={"responsive"}
              showArrow={true}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} trạng thái`}
              placeholder={<span style={{ color: "#343A40" }}>Trạng thái</span>}
              style={{ width: "100%" }}
            >
              {(config || []).map((item) => (
                <TreeSelect.TreeNode key={item?.code} value={item?.code} title={item?.title} />
              ))}
            </TreeSelect>
          </Form.Item>
          <Button
            // loading={loading}
            htmlType="submit"
            style={{
              background: "#1E447E",
              color: "#ffffff",
              textAlign: "center",
              borderRadius: 5,
              border: "1px solid #1E447E",
              height: 32,
              alignItems: "center",
              display: "flex",
            }}
          >
            <img src={getPath("/icons/accounts/ic-search.svg")}/>
            Tìm kiếm
          </Button>
          </div>
        </Form>
      </div>
    </>
  );
}

export default Filter;
