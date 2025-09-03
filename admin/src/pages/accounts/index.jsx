import { Avatar, Dropdown, Menu, Pagination, Spin, Table } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { dropdownAction, StatusWidget } from "./components/common-renderers";
import MdConfirm from "./components/mdConfirm";
import MdInputReason from "./components/mdInputReason";
import Filter from "./components/Filter";
import { getPath } from "../../utils";

const hardData = [
  { uid: "ac7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "bc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "cc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "dc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "ec7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "fc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "gc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "hc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "kc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
  { uid: "mc7b4d8d-a08a-4c64-b28f-400c556003fd", fullName: "Abcccc", phone: "0987654321", email: "a@gmail.com", dob: "01/01/2000", status: "Active" },
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

export default function Accounts() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(hardConfig);
  const [data, setData] = useState(hardData);
  const [formData, setFormData] = useState({ page: 1, pageSize: 10 });
  const [confirmModalVisible, setConfirmModalVisible] = useState({});
  const [reasonModalVisible, setReasonModalVisible] = useState({});
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);

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
          style={{ display: i.visible(dataNote?.status) ? "" : "none" }}
          onClick={() => {
            switch (i.id) {
              case 1:
                return navigate("/accounts/detail?uid=" + dataNote?.uid);
              case 2:
                return setConfirmModalVisible({ open: true, type: "approve-lock", uid: dataNote?.uid });
              case 3:
                return setReasonModalVisible({ open: true, type: "lock", uid: dataNote?.uid });
              // case 4:
              //   return setConfirmModalVisible({ open: true, type: "open-lock", uid: dataNote?.uid });
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
      title: "Họ & tên",
      //   align: "left",
      render: (_, data) => (
        <div className="flex items-center gap-2 text-left">
          <div className="inline-block rounded-full p-[2px] bg-gradient-to-b from-[#09BAFD] to-[#4285ED]">
            <div className="rounded-full p-[2px] bg-white">
              <Avatar size={35} src={<img src={data?.avatar || getPath("/images/logo.png")} />} />
            </div>
          </div>
          <span className="text-[#003478] font-semibold">{data?.fullname || "Nguyen Van A"}</span>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      render: (_, data) => <div>{data?.phone || ""}</div>,
    },
    {
      title: "Email",
      render: (_, data) => <div>{data?.email || "-"}</div>,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dob",
    },
    {
      title: "Trạng thái",
      render: (_, data) => <StatusWidget status={data?.status} />,
    },
    {
      title: "Lý do khoá",
      render: (_, data) => <div>{data?.reasonForRejection || "-"}</div>,
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
      <div className="text-[16px]">Quản lý tài khoản</div>
      <Filter {...{ config, formData, setFormData }} />
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

      <MdConfirm
        open={confirmModalVisible?.open}
        handleCancel={() => setConfirmModalVisible({})}
        type={confirmModalVisible?.type}
        handleRefuse={() => {
          setConfirmModalVisible({});
          setReasonModalVisible({ open: true, type: confirmModalVisible?.type, uid: confirmModalVisible?.uid, status: "Rejected" });
        }}
        handleApprove={() => {
          switch (confirmModalVisible?.type) {
            case "approve-active":
              return OnChangeStatus({ ...confirmModalVisible, status: "Active" });
            case "lock":
              return OnChangeStatus(confirmModalVisible);
            case "approve-lock":
              return OnChangeStatus({ ...confirmModalVisible, status: "Locked" });
          }
        }}
      />

      <MdInputReason
        reasonModalVisible={reasonModalVisible}
        setReasonModalVisible={setReasonModalVisible}
        handleNext={() => OnChangeStatus(reasonModalVisible)}
      />
    </Spin>
  );
}
