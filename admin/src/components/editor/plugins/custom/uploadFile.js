const iconSvg =
'<svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.25 17H3.24999C2.14542 16.9999 1.24999 16.1045 1.25 14.9999L1.25008 2.99999C1.25008 1.89542 2.14551 1 3.25008 1H12.2503C13.3549 1 14.2503 1.89543 14.2503 3V7M4.75031 5H10.7503M4.75031 8H10.7503M10.7503 11.9616V14.4153C10.7503 15.6278 12.0431 16.7398 13.2556 16.7398C14.4681 16.7398 15.7503 15.6278 15.7503 14.4153V11.3159C15.7503 10.674 15.3813 10.0226 14.5605 10.0226C13.6823 10.0226 13.2556 10.674 13.2556 11.3159V14.2861M4.75031 11H7.75031" stroke="#646D69" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

const CustomUploadFile = {
  name: "CustomUploadFile",
  display: "submenu",
  title: "Upload File",
  buttonClass: "",
  innerHTML: `<div class="se-btn-module"><button type="button" class="se-btn se-btn-module" title="Upload File">${iconSvg}</button></div>`,

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
    this?.options.customUploadFile.on()
  },

  onClickRemove: function () {
    this.submenuOff();
  },
};

export { CustomUploadFile };
