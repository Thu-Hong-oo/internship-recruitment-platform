const iconSvg =
  '<svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.57574 15.0757C1.34142 15.31 1.34142 15.6899 1.57574 15.9243C1.81005 16.1586 2.18995 16.1586 2.42426 15.9243L1.57574 15.0757ZM6 11.5L6.42426 11.0757C6.18995 10.8414 5.81005 10.8414 5.57573 11.0757L6 11.5ZM8 13.5L7.57573 13.9243C7.81005 14.1586 8.18995 14.1586 8.42426 13.9243L8 13.5ZM12.5 9L12.9243 8.57573C12.6899 8.34142 12.31 8.34142 12.0757 8.57573L12.5 9ZM16.0757 13.4243C16.31 13.6586 16.6899 13.6586 16.9243 13.4243C17.1586 13.1899 17.1586 12.81 16.9243 12.5757L16.0757 13.4243ZM2 15.5L2.42426 15.9243L6.42426 11.9243L6 11.5L5.57573 11.0757L1.57574 15.0757L2 15.5ZM6 11.5L5.57573 11.9243L7.57573 13.9243L8 13.5L8.42426 13.0757L6.42426 11.0757L6 11.5ZM8 13.5L8.42426 13.9243L12.9243 9.42426L12.5 9L12.0757 8.57573L7.57573 13.0757L8 13.5ZM12.5 9L12.0757 9.42426L16.0757 13.4243L16.5 13L16.9243 12.5757L12.9243 8.57573L12.5 9ZM4 1V1.6H14V1V0.4H4V1ZM17 4H16.4V14H17H17.6V4H17ZM14 17V16.4H4V17V17.6H14V17ZM1 14H1.6V4H1H0.4V14H1ZM4 17V16.4C2.67452 16.4 1.6 15.3255 1.6 14H1H0.4C0.4 15.9882 2.01177 17.6 4 17.6V17ZM17 14H16.4C16.4 15.3255 15.3255 16.4 14 16.4V17V17.6C15.9882 17.6 17.6 15.9882 17.6 14H17ZM14 1V1.6C15.3255 1.6 16.4 2.67452 16.4 4H17H17.6C17.6 2.01177 15.9882 0.4 14 0.4V1ZM4 1V0.4C2.01177 0.4 0.4 2.01177 0.4 4H1H1.6C1.6 2.67452 2.67452 1.6 4 1.6V1ZM7 5.5H6.4C6.4 5.99706 5.99706 6.4 5.5 6.4V7V7.6C6.6598 7.6 7.6 6.6598 7.6 5.5H7ZM5.5 7V6.4C5.00294 6.4 4.6 5.99706 4.6 5.5H4H3.4C3.4 6.6598 4.3402 7.6 5.5 7.6V7ZM4 5.5H4.6C4.6 5.00294 5.00294 4.6 5.5 4.6V4V3.4C4.3402 3.4 3.4 4.3402 3.4 5.5H4ZM5.5 4V4.6C5.99706 4.6 6.4 5.00294 6.4 5.5H7H7.6C7.6 4.3402 6.6598 3.4 5.5 3.4V4Z" fill="#686868"/></svg>';

const CustomUploadImage = {
  name: "CustomUploadImage",
  display: "submenu",
  title: "Upload Image",
  buttonClass: "",
  innerHTML: `<div class="se-btn-module"><button type="button" class="se-btn se-btn-module" title="Upload Image">${iconSvg}</button></div>`,

  add: function (core, targetElement) {
    // @Required
    // Registering a namespace for caching as a plugin name in the context object
    const context = core.context;
    let listDiv = this.setSubmenu(core);
    context.customSubmenu = {
      targetButton: targetElement,
      textElement: null,
      currentSpan: null,
      listDiv: listDiv,
    };

    // @Required
    // You must add the "submenu" element using the "core.initMenuTarget" method.
    /** append target button menu */
    core.initMenuTarget(this.name, targetElement, listDiv);
  },

  setSubmenu: function (core) {
    const listDiv = core.util.createElement("DIV");
    // @Required
    // A "se-submenu" class is required for the top level element.
    listDiv.className = "se-submenu se-list-layer se-list-emoji-picmo";
    listDiv.innerHTML =
      "" +
      '<div class="se-list-inner">' +
      '<div class="emoji-picmo-container"></div>' +
      "</div>";

    return listDiv;
  },

  // @Override core
  // Plugins with active methods load immediately when the editor loads.
  // Called each time the selection is moved.
  active: function (element) {
    this.submenuOff();
    return false;
  },

  // @Override submenu
  // Called after the submenu has been rendered
  on: function () {
    this?.options.CustomUploadImage.on()
  },

  onClickRemove: function () {
    this.submenuOff();
  },
};

export { CustomUploadImage };
