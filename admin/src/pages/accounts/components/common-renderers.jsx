
export const StatusWidget = ({ status = "Active" }) => {
  const STATUS_CONFIG = {
    Active: { color: "#069D27", text: "Đang hoạt động" },
    Violation: { color: "#FF003D", text: "Vi phạm" },
    Rejected: { color: "#FF003D", text: "Từ chối duyệt" },
    Locked: { color: "#BF272D", text: "Khoá tài khoản" },
    Pending_Review: { color: "#FFA21F", text: "Chờ kiểm duyệt" },
    Pending_Lock: { color: "#FFA21F", text: "Chờ khoá tài khoản" },
    InActive: { color: "#343A40", text: "Chưa hoạt động" },
  };
  const { color, text } = STATUS_CONFIG[status] || {};
  return (
    <div className="flex items-center gap-2 whitespace-nowrap" style={{ color: color }}>
      <div
        style={{
          height: 8,
          width: 8,
          background: color,
          borderRadius: "50%",
        }}
      ></div>
      {text}
    </div>
  );
};

export const dropdownAction = [
  {
    id: 1,
    title: "Xem chi tiết",
    avatar: <img src="/icons/accounts/ic-eye.png" className="cursor-pointer w-[22px]" />,
    visible: () => true,
  },
  {
    id: 2,
    title: "Duyệt khoá tài khoản",
    avatar: <img src="/icons/accounts/ic-approve.svg" className="cursor-pointer w-[20px]" />,
    visible: () => true,

    // visible: (status) => ["Pending_Lock_Approval"].includes(status),
  },
  {
    id: 3,
    title: "Khoá tài khoản",
    avatar: <img src="/icons/accounts/ic-lock.svg" className="cursor-pointer w-[20px]" />,
    visible: () => true,
    // visible: (status) => ["Active"].includes(status),
  },
  // {
  //   id: 4,
  //   title: "Mở khoá tài khoản",
  //   avatar: <img src={getPath("/icons/accounts/ic-mo-khoa.svg")} className="cursor-pointer w-[20px]" />,
  //   visible: () => true,
  //   // visible: (status) => ["Pending_Review"].includes(status),
  // },
];

export const renderSuccessText = (type, status) => {
  if (type === "approve-active" && status === "Active") return "Duyệt tài khoản thành công";
  if (type === "approve-active" && status === "Rejected") return "Đã từ chối duyệt tài khoản";
  if (type === "lock") return "Khóa tài khoản thành công";
  if (type === "approve-lock" && status === "Locked") return "Duyệt khóa tài khoản thành công";
  if (type === "approve-lock" && status === "Rejected") return "Đã từ chối duyệt khóa tài khoản";
};

export const renderButtonText = (status) => {
  switch (status) {
    case "Pending_Review":
      return "Duyệt tài khoản";
    case "Pending_Lock":
      return "Duyệt khóa tài khoản";
    default:
      return "";
  }
};
