import { Button, Form, Input, Select, TreeSelect } from "antd";
import React from "react";
import { getPath } from "../../../utils";
const { Option } = Select;

const categoryConfig = [
  { title: "Bảo hiểm trách nhiệm", code: "liability" },
  { title: "Bảo hiểm xe cơ giới", code: "motor" },
  { title: "Bảo hiểm hàng hải", code: "marine" },
  { title: "Bảo hiểm tai nạn", code: "accident" },
  { title: "Bảo hiểm sức khỏe", code: "health" },
  { title: "Bảo hiểm du lịch", code: "travel" },
  { title: "Bảo hiểm nhà ở", code: "home" },
  { title: "Bảo hiểm nhân thọ", code: "life" },
];

const type = [
  { title: "Tất cả hình ảnh/video", code: "all" },
  { title: "Hình ảnh", code: "home" },
  { title: "Video", code: "health" },
];

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
      <div style={{ marginTop: 16 }}>
        <Form ref={formRef} layout={"vertical"} scrollToFirstError form={form} onFinish={onFinish} autoComplete="off">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <Form.Item name={"category"} style={{ margin: 0, flex: 1 }}>
              <TreeSelect
                allowClear
                multiple
                showSearch={false}
                treeCheckable={true}
                className="custom-Treeselect"
                popupClassName="custom-popup-treeselect"
                maxTagCount={"responsive"}
                showArrow={true}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} danh mục`}
                placeholder={<span style={{ color: "#343A40" }}>Danh mục</span>}
                style={{ width: "100%" }}
              >
                {(categoryConfig || []).map((item) => (
                  <TreeSelect.TreeNode key={item?.code} value={item?.code} title={item?.title} />
                ))}
              </TreeSelect>
            </Form.Item>
            <Form.Item name={"type"} style={{ margin: 0, flex: 1 }}>
              <Select allowClear showSearch={false} placeholder="Tất cả hình ảnh/video" className="custom-select">
                {type.map((item) => (
                  <Option key={item.code} value={item.code}>
                    {item.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, flex: 1 }} name="fullname">
              <Input className="custom-input" allowClear placeholder="Tìm theo tên hình ảnh" style={{ width: "100%" }} />
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
              <img src={getPath("/icons/accounts/ic-search.svg")} />
              Tìm kiếm
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}

export default Filter;
