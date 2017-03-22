
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


export function carouselInit(){
    $('.carousel-in').each(function () {
        let $root = $(this);
        let $thumbs = $root.next('.carousel-in-thumbs');

        $root.slick({
            accessibility: false,
            dots: false,
            arrows: true,
            fade: true
        });

        $thumbs.on('click', '.list__item', function () {
            $root.slick('slickGoTo', $(this).index());
        });

        $root.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            $thumbs.find('li').eq(nextSlide).addClass('-active').siblings('li').removeClass('-active');
        });
    });
}


export let Render = {
    active: false,
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
    coordinates: [],
    projection: null,
    reactApp: null,

    init: function(opt){

        this.reactApp = opt.reactApp;
        this.canvas = opt.canvas;
        this.projection = opt.projection;

        this.ctx = this.canvas.getContext("2d");

        $(this.canvas).css({'width':($("#map").width()+'px')}).attr('width', $("#map").width());
        $(this.canvas).css({'height':($("#map").height()+'px')}).attr('height', $("#map").height());

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
            this.drawing = false;
        }
    },

    erase: function(){

        this.canDraw = true;
        this.coordinates = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    findxy: function(res, type, e){

        if(!this.reactApp.state.isRender) return;

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

            this.coordinates.push(this.projection.fromGlobalPixels( this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));

            this.drawing = true;
            this.draw('start');
        }else if (res == 'up' || res == "out") {
            if(!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = this.mainX;
            this.currY = this.mainY;

            this.coordinates.push(this.projection.fromGlobalPixels( this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));



            this.reactApp.map.polygon = new ymaps.Polygon([
                this.coordinates
            ], {}, {
                fillColor: Render.fill + '88',
                strokeColor: Render.color,
                strokeWidth: Render.line,
                strokeStyle: 'shortdash'
            });

            this.reactApp.map.entity.geoObjects.add(this.reactApp.map.polygon);

            console.log('coordinates: ', this.coordinates);

            this.reactApp.setState({
                coordinates: this.coordinates,
                isRender: false,
            });

            this.draw('finish');
        }else if (res == 'move') {

            if(!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.X = dist.clientX;
            this.Y = dist.clientY+$(document).scrollTop();
            this.currX = dist.clientX - $(this.canvas).offset().left;
            this.currY = dist.clientY - $(this.canvas).offset().top+$(document).scrollTop();

            this.coordinates.push(this.projection.fromGlobalPixels( this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));

            this.draw();
        }
    }


}