import { Avatar, Image, Spin } from "antd";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusWidget } from "./components/common-renderers";
import { getPath } from "../../utils";

const hardData = (data) => [
  { label: "Họ và tên", value: data?.fullname },
  { label: "Giới tính", value: data?.gender },
  { label: "Ngày sinh", value: data?.dob },
  { label: "CCCD/Hộ chiếu", value: data?.cmnd },
  { label: "Số điện thoại", value: data?.phone },
  { label: "Email", value: data?.email },
  { label: "Tỉnh, thành phố", value: data?.province },
  { label: "Quận, huyện", value: data?.district },
  { label: "Địa chỉ", value: data?.address },
];

export default function AccountsDetail() {
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState({});
  const [loadingPage, setLoadingPage] = useState(false);
  const showRef = useRef({});

  // useEffect(() => {
  //   dispatch("inital");
  // }, []);

  return (
    <Spin spinning={loadingPage} delay={500}>
      <div className="flex items-center gap-1">
        <img src={getPath("/icons/accounts/btn-back.svg")} onClick={() => navigate("/accounts")} className="mr-1 w-[28px] cursor-pointer" />
        <div className="text-[16px] cursor-pointer ">Quản lý tài khoản</div>
        <img src={getPath("/icons/accounts/ic-chevron-right.svg")} />
        <div className="text-[16px]">Xem chi tiết</div>
      </div>

      {["Locked", "Pending_Lock_Approval"].includes(detailData?.statusCode) && (
        <div className="bg-[#FDF0F1] border border-[#D2D2D2]/50 px-[30px] py-[15px] mt-5 rounded-[24px]">
          <div className="title flex font-medium text-[20px] mb-[5px]">
            <img src={getPath("/icons/accounts/block-account.svg")} alt="block" className="mr-1" />
            <span> Tài khoản bị khoá</span>
          </div>
          <div>{detailData?.reasonForSuspension || ""}</div>
        </div>
      )}
      <div className="flex gap-4">
        <div className="w-[70%] bg-white shadow-md rounded-2xl p-6 mt-4">
          <div className="flex items-center gap-2 text-left">
            <div className="inline-block rounded-full p-[2px] bg-gradient-to-b from-[#09BAFD] to-[#4285ED]">
              <div className="rounded-full p-[2px] bg-white">
                <Avatar size={45} src={<img src={detailData?.avatar || getPath("/images/logo.png")} />} />
              </div>
            </div>
            <div>
              <div className="text-base text-[#003478] font-semibold">Ninh Vinh Quang</div>
              <div className="text-xs text-[#969696]">Học viên</div>
              <StatusWidget status={detailData?.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-4 mt-6 text-sm">
            {hardData(detailData).map((item) => (
              <div key={item.label}>
                <div className="text-[#003478]">{item.label}</div>
                <div className="h-[0.5px] max-w-[80px] bg-[#003478] mt-[0.5px] mb-1"></div>
                <div className="text-gray-900">{item.value || "Abccwdkvbsk dkjsbcnkjas"}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="btn btn-active flex gap-[5px]">
              <img src={getPath("/icons/accounts/ic-btn-approve.svg")} />
              Duyệt tài khoản
            </button>
          </div>
        </div>
        <div className="w-[30%] bg-white shadow-md rounded-2xl p-6 mt-4">
          <div className="text-[#003478]">Mặt trước CCCD/Hộ chiếu</div>
          <div className="h-[0.5px] max-w-[170px] bg-[#003478] mt-[0.5px] mb-1"></div>
          <div className="w-full aspect-[3/2] flex items-center justify-center relative bg-white border border-[#D2D2D2] mt-[15px] p-2 rounded-2xl">
            <img
              src={getPath("/icons/accounts/ic-showfull.svg")}
              alt="full"
              className="absolute right-2 top-2 z-20 cursor-pointer"
              // onClick={() => dispatch({ type: "previewImage", name: "privateIdFront", value: true })}
            />
            <Image src={detailData?.privateIdFrontUrl?.[0] || getPath("/images/logo.png")} className="w-full h-full object-contain rounded-xl"/>
          </div>

          <div className="text-[#003478] mt-6">Mặt trước CCCD/Hộ chiếu</div>
          <div className="h-[0.5px] max-w-[170px] bg-[#003478] mt-[0.5px] mb-1"></div>
          <div className="w-full aspect-[3/2] flex items-center justify-center relative bg-white border border-[#D2D2D2] mt-[15px] p-2 rounded-2xl">
            <img
              src={getPath("/icons/accounts/ic-showfull.svg")}
              alt="full"
              className="absolute right-2 top-2 z-20 cursor-pointer"
              // onClick={() => dispatch({ type: "previewImage", name: "privateIdBack", value: true })}
            />
            <Image src={detailData?.privateIdBackUrl?.[0] || getPath("/images/logo.png")} className="w-full h-full object-contain rounded-xl"/>
          </div>
        </div>
      </div>
    </Spin>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "#069D27";
    case "Pending_Review":
      return "#FFA21F";
    case "Pending_Lock_Approval":
      return "#E8B602";
    case "Locked":
      return "#969696";
    case "Rejected":
      return "#FF003D";
    default:
      return "#069D27";
  }
};
