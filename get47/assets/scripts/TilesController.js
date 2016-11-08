var DIR = cc.Enum({
    UP:-1,
    DOWN:-1,
    LEFT:-1,
    RIGHT:-1
});
var GAME_STATE = cc.Enum({
    PLAYING:-1,
    WIN:-1
});
cc.Class({
    extends: cc.Component,

    properties: {
        gameState:{
            type:GAME_STATE,
            default:GAME_STATE.PLAYING
        },
        score:0,
        scoreLabel:cc.Label,
        tiles:[],
        tilesLayout:cc.Node,
        tilePrefab:cc.Prefab,
        rowNum:0,
        colNum:0,
        padding:0,
        spacing:0,
    },

    init: function (game) {
        this.game = game;
        this.scoreLabel.string = this.score+"";
        this.gameState = GAME_STATE.PLAYING;
        this.tileWidth = (this.tilesLayout.width - this.padding*2 - this.spacing*(this.colNum-1))/this.colNum;
        for(let y=0;y<this.rowNum;y++){
            for(let x=0;x<this.colNum;x++){
                let tile = cc.instantiate(this.tilePrefab);
                this.tilesLayout.addChild(tile);                
                tile.width = this.tileWidth;
                tile.height = this.tileWidth;
                tile.position = cc.p(this.padding + x*(this.tileWidth+this.spacing),
                    this.padding + y*(this.tileWidth+this.spacing));
                tile.getComponent("Tile").posIndex = tile.position;
                tile.tag = y*this.colNum + x;
                this.addTouchEvent(tile);
                this.tiles.push(tile);
            }
        }
        this.touchAble = false;
        this.deleteTiles();
    },

    addTouchEvent(tile){
        var p1,p2,dir;
        let self = this;
        var getDir = function(){
            if(Math.abs(p2.x-p1.x) > Math.abs(p2.y-p1.y)){
                if(p2.x>p1.x){
                    dir = DIR.RIGHT;
                }else{
                    dir = DIR.LEFT;
                }
            }else{
                if(p2.y>p1.y){
                    dir = DIR.UP;
                }else{
                    dir = DIR.DOWN;
                }
            }
            if(self.gameState === GAME_STATE.PLAYING && self.touchAble){
                self.touchAble = false;
                self.tryExchange(tile, dir);
            }
        }
        tile.on('touchstart',function(e){
            p1 = e.getLocation();
        },this);
        tile.on('touchmove',function(e){
            
        },this);
        tile.on('touchend',function(e){
            p2 = e.getLocation();
            getDir();
        },this);
        tile.on('touchcancel',function(e){
            p2 = e.getLocation();
            getDir();
        },this);
        
    },
    
    tryExchange(tile,dir){
        var neighborTile = this.getNeighborTile(tile,dir);
        if(neighborTile === null){
            return;
        }
        
        this.exchangeTwoTilesState(tile, neighborTile);
        var hLines = this.getHorizontalLines();
        var vLines = this.getVerticalLines();
        if(hLines.length+vLines.length > 0){
            this.exchangeTwoTilesPosIndex(tile, neighborTile);
            let finished = 0;
            let total = 2;
            let self = this;
            let action1 = cc.sequence(cc.moveTo(0.15,tile.getComponent("Tile").posIndex),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.deleteTiles();
                    }
                })
            );
            let action2 = cc.sequence(cc.moveTo(0.15,neighborTile.getComponent("Tile").posIndex),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.deleteTiles();
                    }
                })
            );
            tile.runAction(action1);
            neighborTile.runAction(action2);
        }else{
            this.exchangeTwoTilesState(tile, neighborTile);
            var finished = 0;
            var total = 2;
            var self = this;
            var tilePos = tile.position;
            var neighborTilePos = neighborTile.position;
            var action1 = cc.sequence(cc.moveTo(0.1,neighborTilePos),cc.moveTo(0.1,tilePos),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.touchAble = true;
                    }
                })
            );
            var action2 = cc.sequence(cc.moveTo(0.1,tilePos),cc.moveTo(0.1,neighborTilePos),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.touchAble = true;
                    }
                })
            );
            tile.runAction(action1);
            neighborTile.runAction(action2);
        }
        
        
    },
    
    exchangeTwoTilesState(tile1,tile2){
        this.tiles[tile1.tag] = tile2;
        this.tiles[tile2.tag] = tile1;
        
        var tile1Tag = tile1.tag;
        tile1.tag = tile2.tag;
        tile2.tag = tile1Tag;
    },
    
    exchangeTwoTilesPosIndex(tile1,tile2){//交换位置信息，实际位置没有改变
        var tile1Pos = tile1.getComponent("Tile").posIndex;
        var tile2Pos = tile2.getComponent("Tile").posIndex;

        tile1.getComponent("Tile").posIndex = tile2Pos;
        tile2.getComponent("Tile").posIndex = tile1Pos;
    },

    deleteTiles(){
        let self = this;
        var hLines = this.getHorizontalLines();
        var vLines = this.getVerticalLines();
        if(hLines.length + vLines.length===0){
            this.touchAble = true;
            return;
        }
        var addNumber = 0;//横加竖减
        var minusNumber = 0;
        var lines = [];
        for(let i in hLines){
            addNumber += hLines[i].getComponent("Tile").type;
            lines.push(hLines[i]);
        }
        for(let i in vLines){
            minusNumber += vLines[i].getComponent("Tile").type;
            let isExist = false;
            for(let j in hLines){
                if(hLines[j] === vLines[i]){
                    isExist = true;
                }
            }
            if(!isExist){
                lines.push(vLines[i]);
            }
        }

        this.score += (addNumber - minusNumber);
        if(this.score === 47){
            this.gameState = GAME_STATE.WIN;
            this.scoreLabel.string = "YOU GET 47!";
        }else{
            this.scoreLabel.string = this.score+"";
        }

        var finished = 0;
        var total = lines.length;
        for(let i=0;i<total;i++){
            let action = cc.sequence(cc.scaleTo(0.15, 0, 0),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.fallTiles();
                    }
                })
            );
            lines[i].getComponent("Tile").isAlive = false;
            lines[i].runAction(action);
        }
    },

    fallTiles(){
        let self = this;
        //下落
        var isAllFall = false;
        while(!isAllFall){
            isAllFall = true;
            for(let y=1;y<this.rowNum;y++){
                for(let x=0;x<this.rowNum;x++){
                    if(this.tiles[y*this.colNum+x].getComponent("Tile").isAlive && !this.tiles[(y-1)*this.colNum+x].getComponent("Tile").isAlive){
                        this.exchangeTwoTilesState(this.tiles[y*this.colNum+x], this.tiles[(y-1)*this.colNum+x]);
                        this.exchangeTwoTilesPosIndex(this.tiles[y*this.colNum+x], this.tiles[(y-1)*this.colNum+x]);
                        isAllFall = false;
                    }
                }
            }
        }
        var fallingTiles = [];
        for(let i in this.tiles){
            if(this.tiles[i].getComponent("Tile").posIndex !== this.tiles[i].position){
                fallingTiles.push(this.tiles[i]);
            }
        }

        var finished = 0;
        var total = fallingTiles.length;
        for(let i=0;i<total;i++){
            let action = cc.sequence(cc.moveTo(0.3, fallingTiles[i].getComponent("Tile").posIndex),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.addTiles();
                    }
                })
            );
            fallingTiles[i].runAction(action);
        }

    },

    addTiles(){
        let self = this;
        //填补空白
        var addingTiles = [];
        for(let y=0;y<this.rowNum;y++){
            for(let x=0;x<this.rowNum;x++){
                if(!this.tiles[y*this.colNum+x].getComponent("Tile").isAlive){
                    addingTiles.push(this.tiles[y*this.colNum+x]);
                }
            }
        }

        var finished = 0;
        var total = addingTiles.length;
        for(let i=0;i<total;i++){
            let action = cc.sequence(cc.scaleTo(0.15, 1,1),
                cc.callFunc(function(){
                    finished++;
                    if(finished == total){
                        self.deleteTiles();
                    }
                })
            );
            addingTiles[i].getComponent("Tile").initType();
            addingTiles[i].getComponent("Tile").isAlive = true;
            addingTiles[i].runAction(action);
        }
    },
    
    getVerticalLines(){
        var lineTiles = [];
        var count = 1;
        for(let x=0;x<this.colNum;x++){
            for(let y=0;y<this.rowNum-2;y=y+count){
                let tile = this.tiles[y*this.colNum+x];
                let tileType = tile.getComponent("Tile").type;
                count = 1;
                for(let n=y+1;n<this.rowNum;n++){
                    if(this.tiles[n*this.colNum+x].getComponent("Tile").type === tileType){
                        count++;
                    }else{
                        break;
                    }
                }
                if(count>=3){
                    for(let i=0;i<count;i++){
                        lineTiles.push(this.tiles[(y+i)*this.colNum+x]);
                    }
                }
            }
        }
        return lineTiles;
    },
    
    getHorizontalLines(){
        var lineTiles = [];
        var count = 1;
        for(let y=0;y<this.rowNum;y++){
            for(let x=0;x<this.colNum-2;x=x+count){
                let tile = this.tiles[y*this.colNum+x];
                let tileType = tile.getComponent("Tile").type;
                count = 1;
                for(let n=x+1;n<this.colNum;n++){
                    if(this.tiles[y*this.colNum+n].getComponent("Tile").type === tileType){
                        count++;
                    }else{
                        break;
                    }
                }
                if(count>=3){
                    for(let i=0;i<count;i++){
                        lineTiles.push(this.tiles[y*this.colNum+x+i]);
                    }
                }
            }
        }
        return lineTiles;
    },
    
    getNeighborTile(tile,dir){
        var x = tile.tag % this.colNum;
        var y = (tile.tag-x) / this.rowNum;
        switch(dir){
            case DIR.LEFT:
                if(x===0){
                    return null
                }else{
                    return this.tiles[y*this.colNum+(x-1)];
                }
            case DIR.RIGHT:
                if(x===this.colNum-1){
                    return null
                }else{
                    return this.tiles[y*this.colNum+(x+1)];
                }
            case DIR.UP:
                if(y===this.rowNum-1){
                    return null
                }else{
                    return this.tiles[(y+1)*this.colNum+x];
                }
            case DIR.DOWN:
                if(y===0){
                    return null
                }else{
                    return this.tiles[(y-1)*this.colNum+x];
                }
        }
    },
    
    newView(){
        if(this.gameState == GAME_STATE.PLAYING && this.touchAble == true){
            var self = this;
            this.touchAble = false;
            var finished = 0;
            var total = this.tiles.length;
            for(let i=0;i<total;i++){
                let action = cc.sequence(cc.scaleTo(0.3, 0, 0),
                    cc.callFunc(function(){
                        finished++;
                        if(finished == total){
                            self.addTiles();
                        }
                    })
                );
                this.tiles[i].getComponent("Tile").isAlive = false;
                this.tiles[i].runAction(action);
            }
        }
    }
});
