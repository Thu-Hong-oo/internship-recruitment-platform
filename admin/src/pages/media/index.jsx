import { Button, Dropdown, Menu, Pagination, Spin, Table } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadFile from "../../components/image-gallery";
import { getPath } from "../../utils";
import Filter from "./components/Filter";
import MdWarning from "./components/mdWarning";
import ModalDetail from "./components/ModalDetail";

const hardData = [
  {
    uid: "ac7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
  {
    uid: "bc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 2,
    createDate: "01/01/2026",
  },
  {
    uid: "cc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 2,
    createDate: "01/01/2026",
  },
  {
    uid: "dc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 2,
    createDate: "01/01/2026",
  },
  {
    uid: "ec7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 2,
    createDate: "01/01/2026",
  },
  {
    uid: "fc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
  {
    uid: "gc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
  {
    uid: "hc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
  {
    uid: "kc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
  {
    uid: "mc7b4d8d-a08a-4c64-b28f-400c556003fd",
    image: getPath("/images/logo.png"),
    category: "Bảo hiểm tai nạn",
    size: "2.5MB",
    type: 1,
    createDate: "01/01/2026",
  },
];

const hardConfig = [
  {
    title: "Đang hoạt động",
    code: "Active",
  },
  {
    title: "Chờ duyệt khóa",
    code: "Pending_Lock_Approval",
  },
  {
    title: "Ngừng hoạt động",
    code: "InActive",
  },
];

export default function Media() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(hardConfig);
  const [data, setData] = useState(hardData);
  const [formData, setFormData] = useState({ page: 1, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openWarning, setOpenWarning] = useState(false);

  //   useEffect(() => {
  //     const timeoutId = setTimeout(() => {
  //       getList();
  //     }, 100);
  //     return () => clearTimeout(timeoutId);
  //   }, [formData]);

  //   const getList = async () => {
  //     setLoading(true);
  //     const dataForm = {
  //       ...formData,
  //       phoneNumber: formData?.phoneNumber || undefined,
  //       fromDate: formData?.fromDate ? moment(formData?.fromDate).format('YYYY-MM-DD') : undefined,
  //       toDate: formData?.toDate ? moment(formData?.toDate).format('YYYY-MM-DD') : undefined,
  //       affProductUid: formData?.affProductUid?.length > 0 ? formData.affProductUid.join(',') : undefined,
  //       status: formData?.status?.length > 0 ? formData.status.join(',') : undefined,
  //     }
  //     await Service.openApiCall("GET", `/v1/crm/affiliate/article/member`, dataForm)
  //       .then((res) => {
  //         let data = res?.data;
  //         if (data.success) {
  //           setData(data?.data?.results);
  //           setTotal(data?.data?.total);
  //         }
  //       })
  //       .catch((err) => {
  //         if (err?.response) {
  //           message.error(err?.response?.data?.error?.statusCode + '|' + err?.response?.data?.message);
  //         }
  //       })
  //       .finally(() => {
  //         setLoading(false);
  //       });
  //   };

  //   const OnChangeStatus = async (data) => {
  //     setLoading(true);
  //     const dataForm =
  //       data.type === "lock"
  //         ? {
  //             uid: data?.uid,
  //             reasonForSuspension: data?.reason,
  //           }
  //         : {
  //             uid: data?.uid,
  //             reasonForRejection: data?.reason,
  //             status: data?.status,
  //           };
  //     await Service.openApiCall("PATCH", `/v1/crm/affiliate/article/member/${data?.type}`, dataForm)
  //       .then((res) => {
  //         setLoading(false);
  //         if (res?.data?.success) {
  //           setReasonModalVisible({});
  //           setConfirmModalVisible({});
  //           message.success({
  //             icon: <img src="/static/affiliate/i-success.svg" width="50" />,
  //             content: <div style={{ marginTop: 10, fontWeight: 500, fontSize: 16 }}>{renderSuccessText(data.type, data?.status)}</div>,
  //             style: { marginTop: "25px", padding: 20 },
  //             duration: 2,
  //           });
  //           getList();
  //         }
  //       })
  //       .catch((err) => {
  //         if (err?.response) {
  //           message.error(err?.response?.data?.error?.statusCode + "|" + err?.response?.data?.message);
  //         }
  //       })
  //       .finally(() => {
  //         setLoading(false);
  //       });
  //   };

  const Action = (dataNote) => (
    <Menu shape="circle" className="custom-menu-dropdown">
      {dropdownAction.map((i, index) => (
        <Menu.Item
          key={index}
          icon={i.avatar}
          onClick={() => {
            switch (i.id) {
              case 1:
                setOpenDetail(true);
                break;
              case 2:
                setOpenDetail(true);
                break;
              case 3:
                setOpenWarning(true);
                break;
              default:
                return null;
            }
          }}
        >
          {i.title}
        </Menu.Item>
      ))}
    </Menu>
  );

  const columns = [
    {
      title: "",
      width: 50,
      render: (item, record, index) => <div>{index + 1 + (formData?.page - 1) * 10}</div>,
    },
    {
      title: "Tên hình ảnh/ video",
      render: (_, data) => (
        <div className="flex justify-center">
          <img src={data?.image} width={50} />
        </div>
      ),
    },
    {
      title: "Danh mục",
      render: (_, data) => <div>{data?.category || ""}</div>,
    },
    {
      title: "Dung lượng",
      render: (_, data) => <div>{data?.size || "-"}</div>,
    },
    {
      title: "Phân loại",
      render: (_, data) => (
        <div className="rounded-2xl py-[2px] px-3" style={{ background: data?.type === 1 ? "#4C64D933" : "#1A74A833" }}>
          {data?.type === 1 ? "Hình ảnh" : "Video"}{" "}
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      render: (_, data) => <div>{data?.createDate || "-"}</div>,
    },
    {
      title: "",
      fixed: "right",
      width: 50,
      render: (_, data) => (
        <Dropdown overlay={Action(data)} trigger={["click"]}>
          <a className="ant-dropdown-link">
            <img src={getPath("/icons/accounts/ic-dropdown.svg")} />
          </a>
        </Dropdown>
      ),
    },
  ];

  return (
    <Spin spinning={loadingPage} delay={500}>
      <div className="text-[16px]">Kho hình ảnh/Video</div>
      <Filter {...{ config, formData, setFormData }} />
      <div className="flex justify-end mt-4 mb-2">
        <Button className="btn" onClick={() => setOpenUpload(true)}>
          <img src={getPath("/icons/common/create.svg")} />
          Thêm hình ảnh/video
        </Button>
      </div>
      <Table
        loading={loadingPage}
        columns={columns}
        dataSource={data || []}
        pagination={false}
        className="ant-border-space table-custom table-cell-p-10"
        rowClassName={() => "rowClassName"}
        bordered={false}
        scroll={{ x: "auto" }}
        showHeader={true}
      />
      <div className="flex justify-center m-4">
        <Pagination
          total={total || 10}
          pageSize={formData?.pageSize}
          onChange={(e) => {
            setFormData({ ...formData, page: e });
          }}
          defaultCurrent={2}
          size="small"
          showSizeChanger={false}
        />
      </div>
      <UploadFile open={openUpload} handleCancel={() => setOpenUpload(false)} />
      <ModalDetail open={openDetail} onCancel={() => setOpenDetail(false)} />
      <MdWarning open={openWarning} onCancel={() => setOpenWarning(false)} />
    </Spin>
  );
}
const dropdownAction = [
  {
    id: 1,
    title: "Xem chi tiết",
    avatar: <img src={getPath("/icons/accounts/ic-eye.png")} className="cursor-pointer w-[20px]" />,
  },
  {
    id: 2,
    title: "Chỉnh sửa thông tin",
    avatar: <img src={getPath("/icons/common/edit.svg")} className="cursor-pointer w-[18px]" />,
  },
  {
    id: 3,
    title: "Xoá hình ảnh/Video",
    avatar: <img src={getPath("/icons/common/delete.svg")} className="cursor-pointer w-[18px]" />,
  },
];
