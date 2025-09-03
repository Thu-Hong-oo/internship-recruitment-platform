import React, { useRef, useState } from "react";
import 'suneditor/dist/css/suneditor.min.css';
import en from "suneditor/src/lang/en"; // 
// import { message } from "antd";
import SunEditor from "suneditor-react";
import plugins from "./plugins";
import { pickerEmoji } from "./plugins/custom/emoji";
import { CustomUploadFile } from "./plugins/custom/uploadFile";
import { CustomUploadImage } from "./plugins/custom/uploadImage";
// import MDFile from "@/component/modals/post/image-gallery";

export default function Editor({
  editor,
  getSunEditorInstance,
  onChangeHandler,
  setListPdf,
  ActionListPdf,
  setLoading,
  minHeight = '300px'
}) {
  const [openMD, setOpenMD] = useState(false);
  const inputFile = useRef();

  const handleCancel = () => {
    setOpenMD(false);
  };

  const onImageUpload = (e) => {
    setOpenMD(true);
  };

  const onFileUpload = (e) => {
    inputFile.current.click();
  }

  const handleFileUpload = (e) => {
    UploadFile(e);
  }

  // const UploadFile = (file) => {
  //   message.warning('Đang lưu file. Vui lòng chờ trong giây lát!');
  //   setLoading(true);
  //   var form = new FormData();
  //   form.append("file", file[0]);
  //   Service.openApiCallFormData("POST", `/v1/crm/affiliate/media/upload`, form)
  //     .then((res) => {
  //       setLoading(false);
  //       let data = res?.data;
  //       if (data.success) {
  //         CreateAttachment(file, data?.data?.url);
  //       }
  //     })
  //     .catch((err) => {
  //       setLoading(false);
  //       if (err?.response) {
  //         message.error(err?.response?.data?.error?.statusCode + '|' + err?.response?.data?.message);
  //       }
  //     });
  // };

  // const CreateAttachment = (values, url) => {
  //   setLoading(true);
  //   const dataForm = {
  //     "title": values[0].name,
  //     "url": url,
  //     "mimeType": 'pdf',
  //     "size": values[0].size,
  //   }
  //   Service.openApiCall("POST", `/v1/crm/affiliate/media/attachment`, dataForm)
  //     .then((res) => {
  //       setLoading(false);
  //       let data = res?.data;
  //       if (data.success) {
  //         message.success('Lưu file dính kèm thành công!');
  //         // setListPdf(res?.data?.data);
  //         ActionListPdf('unshift', '', { ...dataForm, uid: res?.data.data.uid });
  //       }
  //     })
  //     .catch((err) => {
  //       setLoading(false);
  //       if (err?.response) {
  //         message.error(err?.response?.data?.error?.statusCode + '|' + err?.response?.data?.message);
  //       }
  //     });
  // };

  const handleImageUpload = (v) => {
    v.map((v) => v.type === 'image' ?
      editor.current.insertHTML(`
        <figure>
          <img src="${v.url}?uid=${v.uid}" alt="" data-rotate="" data-proportion="true" data-size="," data-align="none" data-percentage="auto,auto" data-file-name="logo-3.png" data-file-size="0" data-origin="," style="width:100%; z-index: 0; height:auto; border-radius: 8px">
        </figure>`
      ) :
      editor.current.insertHTML(`
        <figure>
          <video style="border-radius: 8px" id="${v.uid}" width={'100%'} controls>
            <source src="${v.url}?uid=${v.uid}" type="video/mp4" />
          </video>
        </figure>
        `)
    )
  }

  const editorOptions = {
    mode: "",
    height: '100%',
    minHeight,
    plugins: { ...plugins, pickerEmoji, CustomUploadImage, CustomUploadFile },
    icons: {
      bold: '<svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M1 9V17H9.30769C11.5168 17 13.3077 15.2091 13.3077 13C13.3077 10.7909 11.5168 9 9.30769 9H1ZM1 9H8.07692C10.2861 9 12.0769 7.20914 12.0769 5C12.0769 2.79086 10.2861 1 8.07692 1H1V9Z" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      underline:
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M15 15H1M13 2V7C13 9.76142 10.7614 12 8 12C5.23858 12 3 9.76142 3 7V2M1.5 1H4.5M11.5 1L14.5 1" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      italic:
        '<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.20833 15L9.25278 1M5.20833 15H1M5.20833 15H9.41667M9.25278 1H5.04444M9.25278 1H13.4611" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      align_left:
        '<svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L17 1M1 5.33333L12.7701 5.33333M1 9.66667L17 9.66667M1 14L9.55173 14" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      align_justify:
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3L18 3M2 7.33333L18 7.33333M2 11.6667L18 11.6667M2 16L18 16" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      align_right:
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16H2M18 11.6667H6.22988M18 7.33333H2M18 3L9.44827 3" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      align_center:
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.5H2M16.5 12.1667H4.72989M18 7.83333H2M14.5 4L5.94828 4" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      list_bullets:
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.26667 5H18M7.26667 10.4H18M7.26667 15.8H18M3 5V5.01067M3 10.4V10.4107M3 15.8V15.8107" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
      list_number:
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 4H18M9 10H18M10 16H18M2 14C2 13.4696 2.21071 12.9609 2.58579 12.5858C2.96086 12.2107 3.46957 12 4 12C4.53043 12 5.03914 12.2107 5.41421 12.5858C5.78929 12.9609 6 13.4696 6 14C6 14.591 5.5 15 5 15.5L2 18H6M4 8V2L2 4" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round" fill="none"/></svg>',
      highlight_color:
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.50739 12.5H9.10345M9.10345 12.5H10.7734M9.10345 12.5V5.5M9.10345 5.5H6.5C6.22386 5.5 6 5.72386 6 6V6.73529M9.10345 5.5H11.5C11.7761 5.5 12 5.72386 12 6V6.94118M3 17H15C16.1046 17 17 16.1046 17 15V3C17 1.89543 16.1046 1 15 1H3C1.89543 1 1 1.89543 1 3V15C1 16.1046 1.89543 17 3 17Z" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round" fill="none"/></svg>',
      table:
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.1 1C7.1 0.668629 6.83137 0.4 6.5 0.4C6.16863 0.4 5.9 0.668629 5.9 1H7.1ZM5.9 17C5.9 17.3314 6.16863 17.6 6.5 17.6C6.83137 17.6 7.1 17.3314 7.1 17H5.9ZM4 1V1.6H14V1V0.4H4V1ZM17 4H16.4V14H17H17.6V4H17ZM14 17V16.4H4V17V17.6H14V17ZM1 14H1.6V4H1H0.4V14H1ZM4 17V16.4C2.67452 16.4 1.6 15.3255 1.6 14H1H0.4C0.4 15.9882 2.01178 17.6 4 17.6V17ZM17 14H16.4C16.4 15.3255 15.3255 16.4 14 16.4V17V17.6C15.9882 17.6 17.6 15.9882 17.6 14H17ZM14 1V1.6C15.3255 1.6 16.4 2.67452 16.4 4H17H17.6C17.6 2.01178 15.9882 0.4 14 0.4V1ZM4 1V0.4C2.01177 0.4 0.4 2.01177 0.4 4H1H1.6C1.6 2.67452 2.67452 1.6 4 1.6V1ZM6.5 1H5.9V17H6.5H7.1V1H6.5ZM1.5 6.5V7.1H16.5V6.5V5.9H1.5V6.5Z" fill="#646D69"/></svg>',
      link: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M4.149 6.49164L2.28779 8.35285C1.59268 9.04796 1.19295 9.99376 1.20025 10.9878C1.20756 11.9818 1.59854 12.9334 2.32664 13.639C3.03221 14.3671 3.98398 14.7581 4.97783 14.7654C5.99435 14.7728 6.91777 14.3956 7.61292 13.7005L9.47413 11.8393M11.8515 9.5074L13.7127 7.64619C14.4078 6.95108 14.8075 6.00528 14.8002 5.01127C14.7929 4.01726 14.4019 3.06568 13.6738 2.36007C12.9684 1.65467 12.0168 1.26366 11.0228 1.25636C10.0288 1.24905 9.08288 1.62609 8.38773 2.32123L6.52652 4.18244M5.17783 10.7722L10.7615 5.18852" stroke="#646D69" stroke-width="1.2" strokeLinecap="round" stroke;inejoin="round"/></svg>',
    },
    buttonList: [
      ["bold", "underline", "italic"],
      ["align", "hiliteColor", "list", "table", "link"],
      ["CustomUploadFile", "CustomUploadImage", "pickerEmoji"],
    ],
    customUploadFile: {
      on: () => onFileUpload()
    },
    CustomUploadImage: {
      on: () => onImageUpload(),
    },
    imageRotation: true,
    // fontSize: [12, 14, 16, 18, 20],
    defaultStyle: 'font-size: 16px;',
    pasteFilterStyle: false,
    colorList: [
      [
        "#828282",
        "#FF5400",
        "#676464",
        "#F1F2F4",
        "#FF9B00",
        "#F00",
        "#fa6e30",
        "#000",
        "rgba(255, 153, 0, 0.1)",
        "#FF6600",
        "#0099FF",
        "#74CC6D",
        "#FF9900",
        "#CCCCCC",
      ],
    ],
    // imageUploadUrl: "http://localhost:8080/chazki-gateway/orders/upload",
  };
  
  const handlePaste = (event) => {
    setTimeout(() => {
      const editor = document.querySelector('.sun-editor-editable');
      if (editor) {
        editor.querySelectorAll('[style]').forEach((el) => {
          el.style.fontSize = '16px';
          el.style.color = 'black';
        });
      }
    }, 100);
  };

  return (
    <>
      <SunEditor
        onPaste={handlePaste}
        lang={en}
        setOptions={editorOptions}
        getSunEditorInstance={getSunEditorInstance}
        onChangeHandler={onChangeHandler}
        placeholder="Nhập nội dung..."
      />
      {/* {
        openMD &&
        <MDFile
          max={5}
          tabsDefault={2}
          seValue={handleImageUpload}
          open={true}
          handleCancel={handleCancel}
        />
      } */}
      <input type="file" accept="application/pdf" ref={inputFile} hidden onChange={(e) => handleFileUpload(e.target.files)} />
    </>
  );
}
