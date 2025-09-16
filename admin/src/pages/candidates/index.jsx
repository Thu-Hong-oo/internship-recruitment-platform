import React from 'react';

const List = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Danh sách ứng viên</h1>
    <p>Quản lý danh sách ứng viên</p>
  </div>
);

const Purchase = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Mua thêm lượt xem ứng viên</h1>
    <p>Mua thêm lượt xem thông tin ứng viên</p>
  </div>
);

const Applications = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Đơn ứng tuyển</h1>
    <p>Quản lý đơn ứng tuyển</p>
  </div>
);

const Interviews = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Lịch phỏng vấn</h1>
    <p>Quản lý lịch phỏng vấn ứng viên</p>
  </div>
);

const Hired = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Ứng viên đã tuyển</h1>
    <p>Danh sách ứng viên đã được tuyển</p>
  </div>
);

const index = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý ứng viên</h1>
      <p>Chọn chức năng quản lý ứng viên</p>
    </div>
  );
};

export default index;
export { List, Purchase, Applications, Interviews, Hired };
