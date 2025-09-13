import { Avatar, Dropdown, Menu, Pagination, Spin, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dropdownAction, StatusWidget } from "./components/common-renderers";
import MdConfirm from "./components/mdConfirm";
import MdInputReason from "./components/mdInputReason";
import Filter from "./components/Filter";
import { usersAPI } from "../../api/users";

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
    title: "Chưa kích hoạt",
    code: "InActive",
  },
];

export default function Accounts() {
  const navigate = useNavigate();

  const [config] = useState(hardConfig);
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    page: 1,
    pageSize: 10,
    role: undefined,
    status: undefined,
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState({});
  const [reasonModalVisible, setReasonModalVisible] = useState({});
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageLabel, setPageLabel] = useState("1/1");

  const getUsersList = useCallback(async () => {
    try {
      setLoadingPage(true);
      const res = await usersAPI.getUsers({
        page: formData?.page || 1,
        limit: formData?.pageSize || 10,
        role: formData?.role || undefined,
        status: formData?.status || undefined,
      });

      const mapped = (res?.users || []).map((u, idx) => ({
        uid: u?.id || u?._id || String(idx),
        fullname:
          u?.fullName ||
          [u?.profile?.firstName, u?.profile?.lastName]
            .filter(Boolean)
            .join(" ") ||
          "",
        avatar:
          u?.profile?.avatar && String(u.profile.avatar).trim() !== ""
            ? u.profile.avatar
            : null,
        phone: u?.profile?.phone || "",
        email: u?.email || "",
        dob: u?.profile?.dateOfBirth
          ? new Date(u.profile.dateOfBirth).toLocaleDateString()
          : "",
        status: u?.isEmailVerified ? "Active" : "InActive",
        role: u?.role || "",
      }));

      setData(mapped);
      setTotal(res?.total || 0);
      setPageLabel(res?.pagination?.label || "1/1");
    } catch (error) {
      void error; // noop to satisfy linter
    } finally {
      setLoadingPage(false);
    }
  }, [formData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getUsersList();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [formData, getUsersList]);

  // Temporary stub until status actions are implemented
  const OnChangeStatus = () => {};

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
                return setConfirmModalVisible({
                  open: true,
                  type: "approve-lock",
                  uid: dataNote?.uid,
                });
              case 3:
                return setReasonModalVisible({
                  open: true,
                  type: "lock",
                  uid: dataNote?.uid,
                });
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
      render: (item, record, index) => (
        <div>{index + 1 + (formData?.page - 1) * 10}</div>
      ),
    },
    {
      title: "Họ & tên",
      //   align: "left",
      render: (_, data) => (
        <div className="flex items-center gap-2 text-left">
          <div className="inline-block rounded-full p-[2px] bg-gradient-to-b from-[#09BAFD] to-[#4285ED]">
            <div className="rounded-full p-[2px] bg-white">
              <Avatar size={35} src={data?.avatar || "/images/noAvatar.png"} />
            </div>
          </div>
          <span className="text-[#003478] font-semibold">
            {data?.fullname || "Nguyen Van A"}
          </span>
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
    // {
    //   title: "Ngày sinh",
    //   dataIndex: "dob",
    // },
    {
      title: "Trạng thái",
      render: (_, data) => <StatusWidget status={data?.status} />,
    },
    {
      title: "Vai trò",
      render: (_, data) => {
        const roleMap = {
          student: "Người tìm việc",
          employer: "Nhà tuyển dụng",
          admin: "Quản trị viên",
        };
        return <div>{roleMap[data?.role] || data?.role || "-"}</div>;
      },
    },

    {
      title: "",
      fixed: "right",
      width: 50,
      render: (_, data) => (
        <Dropdown overlay={Action(data)} trigger={["click"]}>
          <a className="ant-dropdown-link">
            <img src="/icons/accounts/ic-dropdown.svg" />
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
      <div className="flex justify-between items-center m-4">
        <div className="text-sm text-[#003478]">
          Tổng số users: <b>{total}</b> • Trang: <b>{pageLabel}</b>
        </div>
        <Pagination
          total={total || 0}
          pageSize={formData?.pageSize}
          current={formData?.page}
          onChange={(e) => {
            setFormData({ ...formData, page: e });
          }}
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
          setReasonModalVisible({
            open: true,
            type: confirmModalVisible?.type,
            uid: confirmModalVisible?.uid,
            status: "Rejected",
          });
        }}
        handleApprove={() => {
          switch (confirmModalVisible?.type) {
            case "approve-active":
              return OnChangeStatus({
                ...confirmModalVisible,
                status: "Active",
              });
            case "lock":
              return OnChangeStatus(confirmModalVisible);
            case "approve-lock":
              return OnChangeStatus({
                ...confirmModalVisible,
                status: "Locked",
              });
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
