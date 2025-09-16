'use strict';

const component = {
    name: 'component',

    set_container: function (cover, className) {
        const container = this.util.createElement('DIV');
        container.className = 'se-component ' + className;
        container.appendChild(cover);
        return container;
    },

    set_cover: function (element) {
        const cover = this.util.createElement('FIGURE');
        cover.appendChild(element);
        return cover;
    },

    create_caption: function () {
        const caption = this.util.createElement('FIGCAPTION');
        caption.innerHTML = '<div>' + this.lang.dialogBox.caption + '</div>';
        return caption;
    }
};

export default component;
