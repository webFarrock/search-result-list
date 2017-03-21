
export function number_format(number, decimals, dec_point, thousands_sep) {	// Format a number with grouped thousands
    //
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +	 bugfix by: Michael White (http://crestidg.com)

    var i, j, kw, kd, km;

    // input sanitation & defaults
    if (isNaN(decimals = Math.abs(decimals))) {
        decimals = 2;
    }
    if (dec_point == undefined) {
        dec_point = ",";
    }
    if (thousands_sep == undefined) {
        thousands_sep = ".";
    }

    i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

    if ((j = i.length) > 3) {
        j = j % 3;
    } else {
        j = 0;
    }

    km = (j ? i.substr(0, j) + thousands_sep : "");
    kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
    //kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).slice(2) : "");
    kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");


    return km + kw + kd;
}


export let Render = {
    canvas: '',
    shape: '',
    prevX: 0,
    currX: 0,
    mainX: 0,
    X: 0,
    prevY: 0,
    currY: 0,
    mainY: 0,
    Y: 0,
    drawing: false,
    canDraw: true,
    color: "#666666",
    fill: "#a9bed0",
    line: 1,
    cordinates: [],
    projection: '',
    //tools: document.getElementById('tools'),
    //texts: {on: 'Выделить', off: 'Очистить', cancle: ' Отменить'},
    object: '',

    init: function(opt){
        this.object = opt.object;
        this.canvas = opt.canvas;

        console.log('opt: ', opt);
        $(this.canvas).css({'z-index': 108});
        this.ctx = this.canvas.getContext("2d");
        console.log('this.ctx',this.ctx);

    },

    toolsSet: function(){
        /*
        if(gMap.polygon){
            gMap.polygon.events.remove('editorstatechange');
            gMap.map.geoObjects.remove(gMap.polygon);

            Render.object.setState({

                SEARCH: Render.object.state.SEARCH_RAW
            });
        }
        */

        if(!Render.active){
            Render.active = true;
            //$("#tools").children('span').text(Render.texts.cancle);
            $(this.canvas).css({'z-index': 8});

            $('#render').bind( 'touchmove', Render.touchScroll );

        }else{
            Render.active = false;
            Render.erase();
            //$("#tools").children('span').text(Render.texts.on)
            $(this.canvas).css({'z-index': 0});
            $(document).unbind( 'touchmove', Render.touchScroll );
        }
    },

    draw: function(type){
        if(type == 'start'){
            this.ctx.beginPath();
            this.ctx.moveTo(this.prevX, this.prevY);
        }

        this.ctx.lineTo(this.currX, this.currY);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.line;
        this.ctx.stroke();

        if(type == 'finish'){
            console.log('!!!!!!!!!!!!!!!!!!!!!');

            console.log('finish');
            this.drawing = false;
            //$("#tools").children('span').text(Render.texts.off);
            //$(this.canvas).css({'z-index': 0});
            //this.erase();
            
            console.log('this.cordinates: ', this.cordinates);
            
        }
    },
    erase: function(){

        this.canDraw = true;
        this.cordinates = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    findxy: function(res, type, e){
        var dist = type == 'touch' ? e.targetTouches[0] : e;
        if (res == 'down') {

            if(!this.canDraw){
                this.erase();
                this.findxy('down', e)
            };

            this.canDraw = false;
            this.currX = dist.clientX - $(this.canvas).offset().left;
            this.currY = dist.clientY - $(this.canvas).offset().top+$(document).scrollTop();
            this.X = dist.clientX;
            this.Y = dist.clientY+$(document).scrollTop();
            this.prevX = this.currX;
            this.prevY = this.currY;

            this.mainX = this.currX;
            this.mainY = this.currY;

            //this.cordinates.push(this.projection.fromGlobalPixels( gMap.map.converter.pageToGlobal([this.X, this.Y]), gMap.map.getZoom()));

            this.drawing = true;
            this.draw('start');
        }else if (res == 'up' || res == "out") {
            if(!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = this.mainX;
            this.currY = this.mainY;

           // this.cordinates.push(this.projection.fromGlobalPixels( gMap.map.converter.pageToGlobal([this.X, this.Y]), gMap.map.getZoom()));

            /*
            gMap.polygon = new ymaps.Polygon([
                this.cordinates
            ], {
                hintContent: "Обводка"
            }, {
                fillColor: Render.fill + '88',
                strokeColor: Render.color,
                strokeWidth: Render.line,
                strokeStyle: 'shortdash'
            });

            gMap.map.geoObjects.add(gMap.polygon);
            */

            /*
            var that = this.object;


            that.setState({
                SEARCH: _.filter(that.state.SEARCH_RAW, function(item){
                    if (that.state.HOTELS_INFO && that.state.HOTELS_INFO[item.HOTEL_INFO_ID] && that.state.HOTELS_INFO[item.HOTEL_INFO_ID].PROPS) {
                        var point = that.state.HOTELS_INFO[item.HOTEL_INFO_ID].PROPS.LL_MAP_POINT.VALUE;
                        if (point) {
                            point = point.split(',');
                            try{
                                return gMap.polygon.geometry.contains([point[0], point[1]]);
                            }catch(e){
                                return true;
                            }
                        }
                    }
                })
            });
            */

            $(this.canvas).css({'z-index': 0});

            this.draw('finish');
        }else if (res == 'move') {
            if(!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.X = dist.clientX;
            this.Y = dist.clientY+$(document).scrollTop();
            this.currX = dist.clientX - $(this.canvas).offset().left;
            this.currY = dist.clientY - $(this.canvas).offset().top+$(document).scrollTop();

            //this.cordinates.push(this.projection.fromGlobalPixels( gMap.map.converter.pageToGlobal([this.X, this.Y]), gMap.map.getZoom()));

            this.draw();
        }
    }


}