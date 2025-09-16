import { LoadingOutlined } from "@ant-design/icons";
import { Button, Col, Empty, Form, Input, Modal, Row, Select, Tooltip, TreeSelect } from "antd";
import React, { useEffect, useRef, useState } from "react";
import View from "../view-image-video";
import UploadFileComponent from "./upload-multiple-file";
import { getPath } from "../../utils";

function UploadFile(props) {
  const { open, handleCancel, seValue, tabsDefault, max, maxWidth, maxHeight, maxSizeImage, maxSizeVideo, accept, typeDefault, requiredDimensions } = props;
  const { Option } = Select;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const formRef = React.createRef();
  const [tabsActive, setTabsActive] = useState(tabsDefault || 2);
  const [formData, setFormData] = useState({ page: 1, pageSize: 24 });
  const [images, setImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMax, setSelectMax] = useState(max);
  const [config, setConfig] = useState();
  const { TreeNode } = TreeSelect;
  const [dateView, setDateView] = useState({});
  const [total, setToTal] = useState(0);
  const divRef = useRef();

  const datatab = [
    { id: 2, title: "Thư viện ảnh / video" },
    { id: 1, title: "Tải ảnh / video lên" },
  ];

  useEffect(() => {
    if (typeDefault) {
      form.setFieldsValue({ type: typeDefault });
      setFormData({
        ...formData,
        type: typeDefault,
        page: 1,
      });
    }
    getConfig();
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds((prevSelectedIds) =>
      prevSelectedIds.includes(id)
        ? prevSelectedIds.filter((itemId) => itemId !== id)
        : +selectMax >= 0
        ? prevSelectedIds.length < selectMax
          ? [...prevSelectedIds, id]
          : [...prevSelectedIds]
        : [...prevSelectedIds, id]
    );
  };

  const getConfig = async () => {};

  const onFinish = () => {
    form
      .validateFields()
      .then(() => {
        const filteredImages = images.filter((image) => selectedIds.includes(image.uid));
        seValue(filteredImages);
        handleCancel();
      })
      .catch((err) => {
        console.error("err:", err);
      });
  };

  const onChangForm = ({ data, name }) => {
    setImages([]);
    setFormData({
      ...formData,
      [name]: data,
      page: 1,
    });
  };

  const handleScroll = () => {
    if (loading || formData.page * 24 > +total) return;
    window.scrollTo(0, 0);
    const divElement = divRef.current;
    if (divElement.scrollHeight - divElement.scrollTop === divElement.clientHeight) {
      setFormData({
        ...formData,
        page: +formData?.page + 1,
      });
    }
  };

  return (
    <>
      {dateView?.url && <View dateView={dateView} setDateView={setDateView} />}
      <Modal footer={false} open={open} className="modal-custom-upload" centered closable={false} width={800}>
        <div className="flex items-center justify-center w-full p-2 border-b border-gray-300">
          {datatab.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (loading) return;
                setTabsActive(item.id);
                form.resetFields();
                setToTal("");
                setImages([]);
                setSelectedIds([]);
                setFormData({
                  ...formData,
                  type: typeDefault || undefined,
                  page: 1,
                  pageSize: 26,
                });
                if (typeDefault) {
                  form.setFieldsValue({ type: typeDefault });
                }
              }}
              className={`w-1/2 text-center rounded-md cursor-pointer px-4 py-2 ${tabsActive === item.id ? "bg-white text-[#1E447E]" : "hover:bg-gray-100"}`}
            >
              {item.title}
            </div>
          ))}
        </div>

        {tabsActive === 1 && (
          <UploadFileComponent
            height={300}
            handleCancel={handleCancel}
            seValue={seValue}
            maxWidth={maxWidth || 1080}
            maxHeight={maxHeight || 1080}
            maxSizeImage={maxSizeImage || 20}
            maxSizeVideo={maxSizeVideo || 300}
            accept={accept || ".jpeg, .jpg, .png, .mp4"}
            config={config}
            requiredDimensions={requiredDimensions || false}
          />
        )}

        {tabsActive === 2 && (
          <Form ref={formRef} form={form} onFinish={onFinish} autoComplete="off">
            <div className="flex items-center justify-between">
              <div className="my-5 text-lg font-semibold">Thư viện ảnh / video</div>
              <Form.Item name="title" className="m-0 w-[320px]">
                <Input
                  allowClear
                  onChange={(e) => onChangForm({ data: e.target.value, name: "title" })}
                  className="rounded-full px-3 py-1.5"
                  placeholder="Nhập tên hình ảnh / video để tìm kiếm"
                  suffix={<img src={getPath("/icons/media/search.svg")} />}
                />
              </Form.Item>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <Form.Item name={"type"} style={{ margin: 0, flex: 1 }}>
                <Select allowClear showSearch={false} placeholder="Tất cả hình ảnh/video" className="custom-select">
                  {type.map((item) => (
                    <Option key={item.code} value={item.code}>
                      {item.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
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
            </div>

            {images.length > 0 ? (
              <div ref={divRef} onScroll={handleScroll} className="mt-5 h-[451px] overflow-y-auto overflow-x-hidden">
                <Row gutter={[10, 10]}>
                  {images.map((item) => (
                    <Col key={item.uid} xl={6} xs={24} className="relative cursor-pointer">
                      <Tooltip title={`Kích thước ${item.width}x${item.height}px`} color="#F9FAFC">
                        <div
                          onClick={() => toggleSelection(item.uid)}
                          className={`min-w-[174px] h-[100px] rounded-md border ${selectedIds.includes(item.uid) ? "border-[#003478]" : "border-gray-300"}`}
                        >
                          {item?.type === "image" && <img src={item?.url} alt="" className="w-full h-full object-contain rounded-md" loading="lazy" />}
                          {item?.type === "video" && (
                            <video className="w-full h-[100px] rounded-md" controls={false}>
                              <source src={item?.url} type="video/mp4" />
                            </video>
                          )}
                        </div>
                      </Tooltip>

                      {selectedIds.includes(item.uid) && <img src={getPath("/icons/media/ic-check.png")} width={19} className="absolute left-2 top-1" />}

                      {item?.type === "video" && (
                        <Tooltip title="Click để xem" color="#F9FAFC">
                          <img
                            src={getPath("/icons/media/ic-play-video.png")}
                            width="30"
                            height="30"
                            className="absolute top-[35px] left-[80px] cursor-pointer"
                            onClick={() => setDateView(item)}
                          />
                        </Tooltip>
                      )}

                      <div className="text-center text-xs text-gray-700 mt-1 capitalize">{item?.title}</div>
                    </Col>
                  ))}
                </Row>
                {loading && (
                  <div className="w-full text-center">
                    <LoadingOutlined className="text-base" />
                    <div>Đang tải...</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center mt-5 h-[440px] overflow-y-auto">
                <Empty
                  description={
                    loading ? (
                      <span>
                        <LoadingOutlined className="text-sm" /> Đang tải...
                      </span>
                    ) : (
                      "Không có dữ liệu"
                    )
                  }
                />
              </div>
            )}

            <div className="w-full text-right mt-5">
              <Button onClick={handleCancel}>Quay lại</Button>
              <Button htmlType="submit" loading={loading} disabled={!selectedIds.length} className="btn btn-active ml-3">
                Tải lên
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </>
  );
}

export default UploadFile;

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
