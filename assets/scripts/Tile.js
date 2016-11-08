cc.Class({
    extends: cc.Component,

    properties: {
        pics:{
            type:cc.SpriteFrame,
            default:[],
        },
        _type:1,
        posIndex:cc.Vec,
        type:{
            set:function(value){
                this._type = value;
                this.node.getComponent(cc.Sprite).spriteFrame = this.pics[value-1];
            },
            get:function(){
                return this._type;  
            }
        },
        isAlive:true
    },

    onLoad: function () {
        this.initType();
    },

    initType:function(){
        this.type = Math.floor(Math.random()*this.pics.length) + 1 ;
    },
});
