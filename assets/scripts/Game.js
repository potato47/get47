cc.Class({
    extends: cc.Component,

    properties: {
        tilesController:require("TilesController")
    },

    // use this for initialization
    onLoad: function () {
        this.tilesController.init(this);
    },

});
