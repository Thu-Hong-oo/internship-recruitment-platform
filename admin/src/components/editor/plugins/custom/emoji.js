import { Picker } from "emoji-mart";

const iconSvg =
  '<svg width="19" height="19" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 6.6V6C6.26863 6 6 6.26863 6 6.6H6.6ZM6.67969 6.6H7.27969C7.27969 6.26863 7.01106 6 6.67969 6V6.6ZM11.4 6.6V6C11.0686 6 10.8 6.26863 10.8 6.6H11.4ZM11.4708 6.6H12.0708C12.0708 6.26863 11.8022 6 11.4708 6V6.6ZM6.67969 6.66406V7.26406C7.01106 7.26406 7.27969 6.99543 7.27969 6.66406H6.67969ZM6.6 6.66406H6C6 6.99543 6.26863 7.26406 6.6 7.26406V6.66406ZM11.4708 6.66406V7.26406C11.8022 7.26406 12.0708 6.99543 12.0708 6.66406H11.4708ZM11.4 6.66406H10.8C10.8 6.99543 11.0686 7.26406 11.4 7.26406V6.66406ZM6.73679 11.1168C6.56238 10.8351 6.19259 10.748 5.91083 10.9225C5.62907 11.0969 5.54205 11.4667 5.71646 11.7484L6.73679 11.1168ZM12.2835 11.7484C12.4579 11.4667 12.3709 11.0969 12.0892 10.9225C11.8074 10.748 11.4376 10.8351 11.2632 11.1168L12.2835 11.7484ZM17 9H16.4C16.4 13.0869 13.0869 16.4 9 16.4V17V17.6C13.7496 17.6 17.6 13.7496 17.6 9H17ZM9 17V16.4C4.91309 16.4 1.6 13.0869 1.6 9H1H0.4C0.4 13.7496 4.25035 17.6 9 17.6V17ZM1 9H1.6C1.6 4.91309 4.91309 1.6 9 1.6V1V0.4C4.25035 0.4 0.4 4.25035 0.4 9H1ZM9 1V1.6C13.0869 1.6 16.4 4.91309 16.4 9H17H17.6C17.6 4.25035 13.7496 0.4 9 0.4V1ZM6.6 6.6V7.2H6.67969V6.6V6H6.6V6.6ZM11.4 6.6V7.2H11.4708V6.6V6H11.4V6.6ZM6.67969 6.6H6.07969V6.66406H6.67969H7.27969V6.6H6.67969ZM6.67969 6.66406V6.06406H6.6V6.66406V7.26406H6.67969V6.66406ZM6.6 6.66406H7.2V6.6H6.6H6V6.66406H6.6ZM11.4708 6.6H10.8708V6.66406H11.4708H12.0708V6.6H11.4708ZM11.4708 6.66406V6.06406H11.4V6.66406V7.26406H11.4708V6.66406ZM11.4 6.66406H12V6.6H11.4H10.8V6.66406H11.4ZM9 13V12.4C8.05566 12.4 7.21819 11.8945 6.73679 11.1168L6.22662 11.4326L5.71646 11.7484C6.40163 12.8553 7.61241 13.6 9 13.6V13ZM11.7734 11.4326L11.2632 11.1168C10.7818 11.8945 9.94433 12.4 9 12.4V13V13.6C10.3876 13.6 11.5984 12.8553 12.2835 11.7484L11.7734 11.4326Z" fill="#646D69"/></svg>';

const pickerEmoji = {
  name: "pickerEmoji",
  display: "submenu",
  title: "Emoji",
  buttonClass: "",
  innerHTML: `<div class="se-btn-module"><button type="button" class="se-btn se-btn-module" title="Insert Emoji">${iconSvg}</button></div>`,

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
    listDiv.className = "se-submenu se-list-layer";
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
    const emoji = document.getElementsByTagName("em-emoji-picker");
    if (emoji?.length > 0) return;

    const picker = new Picker({
      locale: "vi",
      theme: "light",
      parent: this.submenu,
      onEmojiSelect: ({ native }) => this.functions.insertHTML(native),
      data: async () => {
        const response = await fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data");
        return response.json();
      },
    });
    return picker;
  },

  onClickRemove: function () {
    this.submenuOff();
  },
};

export { pickerEmoji };
