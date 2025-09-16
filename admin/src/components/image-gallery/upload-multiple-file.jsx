import React, { useState } from "react";
import { Form, Upload, message, Button, Input, Progress } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { getPath } from "../../utils";
import _ from "lodash";

function UploadFile(props) {
  const { height, handleCancel, maxWidth, maxHeight, maxSizeImage, maxSizeVideo, accept, requiredSize } = props;
  const { Dragger } = Upload;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [progress, setProgress] = useState({}); // lưu % nén theo file uid
  const [progressUpload, setProgressUpload] = useState({}); // lưu % upload theo file uid

  const sizeImage = (maxSizeImage || 20) * 1024 * 1024;
  const sizeVideo = (maxSizeVideo || 500) * 1024 * 1024;

  const getMediaDimensions = (file) => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({ type: "video", width: video.videoWidth, height: video.videoHeight });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => reject("Không thể đọc video.");
        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => resolve({ type: "image", width: img.width, height: img.height });
        img.onerror = () => reject("Không thể đọc hình ảnh.");
        img.src = URL.createObjectURL(file);
      } else {
        reject("Định dạng không hỗ trợ.");
      }
    });
  };

  const beforeUpload = async (file) => {
    if (file.type.startsWith("image/") && file.size > sizeImage) {
      message.error("Ảnh tối đa " + maxSizeImage + "MB");
      return Upload.LIST_IGNORE;
    }
    if (file.type.startsWith("video/") && file.size > sizeVideo) {
      message.error("Video tối đa " + maxSizeVideo + "MB");
      return Upload.LIST_IGNORE;
    }
    try {
      const dimensions = await getMediaDimensions(file);
      if (requiredSize && (dimensions.width !== maxWidth || dimensions.height !== maxHeight)) {
        message.error("Kích thước chuẩn " + maxWidth + "x" + maxHeight);
        return Upload.LIST_IGNORE;
      }
      return true;
    } catch (error) {
      message.error(error || "Lỗi khi kiểm tra file.");
      return Upload.LIST_IGNORE;
    }
  };

  const onChange = (info) => {
    const newList = info.fileList.map((f) => {
      if (f.originFileObj) return f.originFileObj;
      return f;
    });
    setFileList(newList);
    form.setFieldsValue({ files: newList });
  };

  const removeFile = (file) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    form.setFieldsValue({ files: fileList.filter((f) => f.uid !== file.uid) });
  };

  const onFinish = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Submit files:", values.files);
        // TODO: call API upload
      })
      .catch((err) => console.error("err:", err));
  };

  return (
    <Form form={form} onFinish={onFinish} autoComplete="off">
      <div className="my-3 text-lg font-semibold">Tải ảnh / video</div>
      {_.isEmpty(fileList) ? (
        <Dragger
          multiple
          disabled={loading}
          customRequest={() => {}} // chặn gọi API mặc định
          accept={accept}
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={onChange}
        >
          <div className={`flex items-center justify-center h-[${height}px]`}>
            {!loading ? (
              <div className="text-base text-center">
                <p className="mt-4">
                  <img src={getPath("/icons/common/upload-img.svg")} width="30" className="inline-block mr-2" />
                </p>
                <p className="mt-2 text-[#B0C0D5]">
                  <b>Kéo thả file vào đây hoặc</b>
                </p>
                <p>
                  <b className="text-[#B0C0D5] underline hover:text-[#000D4D73] hover:cursor-pointer">Tải file lên</b>
                </p>
                <div className="mt-2 mb-5 text-sm text-[#000D4D73]">
                  <i>Các định dạng: {accept}</i>
                  <br />
                  <i>Ảnh tối đa {maxSizeImage}MB</i>
                  <br />
                  <i>Video tối đa {maxSizeVideo}MB</i>
                  <br />
                  <i>
                    Kích thước chuẩn {maxWidth}x{maxHeight}px
                  </i>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <LoadingOutlined className="text-xl" />
                <div>Đang tải file...</div>
              </div>
            )}
          </div>
        </Dragger>
      ) : (
        <div className="grid grid-cols-5 auto-rows-min gap-4 mt-4 h-[500px] overflow-y-auto">
          {fileList.map((file) => (
            <div className="flex flex-col items-center" key={file.uid}>
              <div className="relative border border-dashed p-1 rounded-md">
                {file.type?.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} className="w-full h-32 object-contain rounded-md" />
                ) : (
                  <video className="w-full h-32 object-contain rounded-md" controls>
                    <source src={URL.createObjectURL(file)} type="video/mp4" />
                  </video>
                )}
                <img
                  onClick={() => removeFile(file)}
                  src={ getPath( (progress[file.uid] > 0 || progressUpload[file.uid] > 0) ? "/icons/media/ic-process.svg" : "/icons/media/ic-remove.svg")}
                  width={20}
                  className="absolute top-0 right-0 cursor-pointer"
                />
                {progress[file.uid] > 0 && (
                  <div className="absolute top-1 right-1">
                  <Progress status="active" type="circle" percent={50 || progress[file.uid]} format={(p) => <span className="text-sm text-[#E6EBF2] font-bold">{`Nén ${p}%`}</span>} className="absolute top-0 right-0"/>
                </div>
                )}
                {progressUpload[file.uid] > 0 && (
                  <div className="absolute top-1 right-1">
                  <Progress
                    status="active"
                    type="circle"
                    percent={progressUpload[file.uid]}
                    format={(p) => <span className="text-sm text-[#E6EBF2] font-bold">{`Upload ${p}%`}</span>}
                    className="absolute top-0 right-0"
                  /></div>
                )}
              </div>
              {/* <Progress percent={50} size="small" status="active" /> */}
              <div className="mt-[6px] text-center text-xs text-gray-500 w-32">
                <i title={file.name} className="block truncate hover:cursor-pointer">
                  {file.name}
                </i>
                <i>{(file.size / 1024 / 1024).toFixed(2)} MB</i>
              </div>
            </div>
          ))}
        </div>
      )}
      <Form.Item name="files" rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 file" }]} className="hidden">
        <Input className="hidden" />
      </Form.Item>

      <div className="mt-5 w-full flex justify-center gap-3">
        <Button onClick={handleCancel} className="bg-[#E6EBF2] border-none w-1/2">
          <img src={getPath("/icons/common/double-back.svg")} alt="back" />
          Quay lại
        </Button>
        <Button loading={loading} onClick={onFinish} className="btn btn-active w-1/2">
          Lưu
        </Button>
      </div>
    </Form>
  );
}

export default UploadFile;
