export function naturalSort(array, extractor) {
    "use strict";
    // преобразуем исходный массив в массив сплиттеров
    var splitters = array.map(makeSplitter);
    // сортируем сплиттеры
    var sorted = splitters.sort(compareSplitters);
    // возвращаем исходные данные в новом порядке
    return sorted.map(function (splitter) {
        return splitter.item;
    });
    // обёртка конструктора сплиттера
    function makeSplitter(item) {
        return new Splitter(item);
    }

    // конструктор сплиттера
    //    сплиттер разделяет строку на фрагменты "ленивым" способом
    function Splitter(item) {
        var index = 0;           // индекс для прохода по строке
        var from = 0;           // начальный индекс для фрагмента
        var parts = [];         // массив фрагментов
        var completed = false;       // разобрана ли строка полностью
        // исходный объект
        this.item = item;
        // ключ - строка
        var key = (typeof (extractor) === 'function') ?
            extractor(item) :
            item;
        this.key = key;
        // количество найденных фрагментов
        this.count = function () {
            return parts.length;
        };
        // фрагмент по индексу (по возможности из parts[])
        this.part = function (i) {
            while (parts.length <= i && !completed) {
                next();   // разбираем строку дальше
            }
            return (i < parts.length) ? parts[i] : null;
        };
        // разбор строки до следующего фрагмента
        function next() {
            // строка ещё не закончилась
            if (index < key.length) {
                // перебираем символы до границы между нецифровыми символами и цифрами
                while (++index) {
                    var currentIsDigit = isDigit(key.charAt(index - 1));
                    var nextChar = key.charAt(index);
                    var currentIsLast = (index === key.length);
                    // граница - если символ последний,
                    // или если текущий и следующий символы разнотипные (цифра / не цифра)
                    var isBorder = currentIsLast ||
                        xor(currentIsDigit, isDigit(nextChar));
                    if (isBorder) {
                        // формируем фрагмент и добавляем его в parts[]
                        var partStr = key.slice(from, index);
                        parts.push(new Part(partStr, currentIsDigit));
                        from = index;
                        break;
                    } // end if
                } // end while
                // строка уже закончилась
            } else {
                completed = true;
            } // end if
        } // end next
        // конструктор фрагмента
        function Part(text, isNumber) {
            this.isNumber = isNumber;
            this.value = isNumber ? Number(text) : text;
        }
    }

    // сравнение сплиттеров
    function compareSplitters(sp1, sp2) {
        var i = 0;
        do {
            var first = sp1.part(i);
            var second = sp2.part(i);
            // если обе части существуют ...
            if (null !== first && null !== second) {
                // части разных типов (цифры либо нецифровые символы)
                if (xor(first.isNumber, second.isNumber)) {
                    // цифры всегда "меньше"
                    return first.isNumber ? -1 : 1;
                    // части одного типа можно просто сравнить
                } else {
                    var comp = compare(first.value, second.value);
                    if (comp != 0) {
                        return comp;
                    }
                } // end if
                // ... если же одна из строк закончилась - то она "меньше"
            } else {
                return compare(sp1.count(), sp2.count());
            }
        } while (++i);
        // обычное сравнение строк или чисел
        function compare(a, b) {
            return (a < b) ? -1 : (a > b) ? 1 : 0;
        };
    };
    // логическое исключающее "или"
    function xor(a, b) {
        return a ? !b : b;
    };
    // проверка: является ли символ цифрой
    function isDigit(chr) {
        var code = charCode(chr);
        return (code >= charCode('0')) && (code <= charCode('9'));
        function charCode(ch) {
            return ch.charCodeAt(0);
        };
    };
}

export function numberFormat(number, decimals, dec_point, thousands_sep) {	// Format a number with grouped thousands
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


export function initWeekFilter() {
    try {

        const $tourWeekFilter = $('.tour-week__filter');
        if ($tourWeekFilter.length) {
            $tourWeekFilter.slick({
                slidesToShow: 8,
                centerMode: true,
                centerPadding: 0,
                slidesToScroll: 1,
                focusOnSelect: true,
                initialSlide: 3,
                responsive: [{
                    breakpoint: 1700,
                    settings: {
                        slidesToShow: 5
                    }
                },
                    {
                        breakpoint: 1279,
                        settings: {
                            slidesToShow: 8
                        }
                    },
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 5
                        }
                    },
                    {
                        breakpoint: 760,
                        settings: {
                            slidesToShow: 3
                        }
                    },
                    {
                        breakpoint: 550,
                        settings: {
                            slidesToShow: 3
                        }
                    },
                    {
                        breakpoint: 400,
                        settings: {
                            slidesToShow: 3
                        }
                    }
                ]
            });
        }

    } catch (e) {

        // console.log('initWeekFilter error', e);

    }

}


export function initSliderRange(reactApp = null) {
    try {
        $('.tour-addit__filter .slider-range').each(function () {
            var _ = $(this);
            var index = parseInt(_.attr('data-index'));

            var min = parseInt(_.attr('data-min'));
            var max = parseInt(_.attr('data-max'));
            var step = parseInt(_.attr('data-step'));
            var from = parseInt(_.attr('data-from'));
            var to = parseInt(_.attr('data-to'));

            _.slider({
                range: true,
                min: min,
                max: max,
                values: [from, to],
                step: step,
                slide: (event, ui) => {
                    $('.js-sider-range-from-' + index).val((ui.values[0]).formatMoney(0, '.', ' '));
                    $('.js-sider-range-to-' + index).val((ui.values[1]).formatMoney(0, '.', ' '));

                    $('.js-sider-range-text-from-' + index).text((ui.values[0]).formatMoney(0, '.', ' '));
                    $('.js-sider-range-text-to-' + index).text((ui.values[1]).formatMoney(0, '.', ' '));
                },
                change: (event, ui) => {

                    if (!reactApp) return;

                    const priceFrom = ui.values[0]
                    const priceTo = ui.values[1]

                    if (
                        priceTo != reactApp.state.filter.priceTo ||
                        priceFrom != reactApp.state.filter.priceFrom
                    ) {
                        reactApp.setState({
                            filter: Object.assign({}, reactApp.state.filter, {
                                priceFrom: priceFrom,
                                priceTo: priceTo,
                            }),
                        });

                        reactApp.refs.scrollbars.scrollTop(0);
                    }
                }
            });


            $('.js-sider-range-from-' + index).val((from).formatMoney(0, '.', ' '));
            $('.js-sider-range-to-' + index).val((to).formatMoney(0, '.', ' '));

            $('.js-sider-range-from-' + index).on('keyup focusout', function (e) {
                var value = parseInt(($(this).val()).replace(/\s+/g, ''));

                if (value <= min) value = min;
                if (value >= _.slider('values', 1)) value = _.slider('values', 1);

                _.slider('values', [value, _.slider('values', 1)]);

                if (e.type == 'focusout') {
                    if (value >= _.slider('values', 1)) $(this).val((_.slider('values', 1)).formatMoney(0, '.', ' '));
                }
                ;
            });

            $('.js-sider-range-to-' + index).on('keyup focusout', function (e) {
                var value = parseInt(($(this).val()).replace(/\s+/g, ''));

                if (value >= max) value = max;
                if (value <= _.slider('values', 0)) value = _.slider('values', 0);

                _.slider('values', [_.slider('values', 0), value]);

                if (e.type == 'focusout') {
                    if (value <= _.slider('values', 0)) $(this).val((_.slider('values', 0)).formatMoney(0, '.', ' '));
                }
                ;

            });

            $('.js-sider-range-text-from-' + index).text((from).formatMoney(0, '.', ' '));
            $('.js-sider-range-text-to-' + index).text((to).formatMoney(0, '.', ' '));
        });
    } catch (e) {
    }

}
export function initSliderStars(reactApp = null) {
    try {
        $('.slider-stars').each(function () {
            var _ = $(this);
            var index = parseInt(_.attr('data-index'));

            var min = parseInt(_.attr('data-min'));
            var max = parseInt(_.attr('data-max'));
            var step = parseInt(_.attr('data-step'));
            var from = parseInt(_.attr('data-from'));
            var to = parseInt(_.attr('data-to'));

            _.slider({
                range: 'max',
                min: min,
                max: max,
                value: from,
                step: step,
                change: (event, ui) => {
                    if (!reactApp) return;

                    if (ui.value !== reactApp.state.filter.starsFrom) {
                        reactApp.setState({
                            filter: Object.assign({}, reactApp.state.filter, {
                                starsFrom: ui.value
                            }),
                        });
                    }

                    reactApp.refs.scrollbars.scrollTop(0);
                }
            });
        });
    } catch (e) {
    }
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

    init: function (opt) {

        this.reactApp = opt.reactApp;
        this.canvas = opt.canvas;
        this.projection = opt.projection;

        this.ctx = this.canvas.getContext("2d");

        $(this.canvas).css({'width': ($("#map").width() + 'px')}).attr('width', $("#map").width());
        $(this.canvas).css({'height': ($("#map").height() + 'px')}).attr('height', $("#map").height());

    },

    draw: function (type) {
        if (type == 'start') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.prevX, this.prevY);
        }

        this.ctx.lineTo(this.currX, this.currY);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.line;
        this.ctx.stroke();

        if (type == 'finish') {
            this.drawing = false;
        }
    },

    erase: function () {

        this.canDraw = true;
        this.coordinates = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    findxy: function (res, type, e) {

        if (!this.reactApp.state.isRender) return;

        var dist = type == 'touch' ? e.targetTouches[0] : e;

        if (res == 'down') {

            if (!this.canDraw) {
                this.erase();
                this.findxy('down', e)
            }
            ;

            this.canDraw = false;
            this.currX = dist.clientX - $(this.canvas).offset().left;
            this.currY = dist.clientY - $(this.canvas).offset().top + $(document).scrollTop();
            this.X = dist.clientX;
            this.Y = dist.clientY + $(document).scrollTop();
            this.prevX = this.currX;
            this.prevY = this.currY;

            this.mainX = this.currX;
            this.mainY = this.currY;

            this.coordinates.push(this.projection.fromGlobalPixels(this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));

            this.drawing = true;
            this.draw('start');
        } else if (res == 'up' || res == "out") {
            if (!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = this.mainX;
            this.currY = this.mainY;

            this.coordinates.push(this.projection.fromGlobalPixels(this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));


            this.reactApp.map.polygon = new ymaps.Polygon([
                this.coordinates
            ], {}, {
                fillColor: Render.fill + '88',
                strokeColor: Render.color,
                strokeWidth: Render.line,
                strokeStyle: 'shortdash'
            });

            this.reactApp.map.entity.geoObjects.add(this.reactApp.map.polygon);

            //console.log('coordinates: ', this.coordinates);

            // тут добавить все точки ,, 

            this.reactApp.setState({
                coordinates: this.coordinates,
                markers: this.reactApp.map.markers,
                isRender: false,
            });
            reactApp.refs.scrollbars.scrollTop(0);

            this.draw('finish');
        } else if (res == 'move') {

            if (!this.drawing) return;
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.X = dist.clientX;
            this.Y = dist.clientY + $(document).scrollTop();
            this.currX = dist.clientX - $(this.canvas).offset().left;
            this.currY = dist.clientY - $(this.canvas).offset().top + $(document).scrollTop();

            this.coordinates.push(this.projection.fromGlobalPixels(this.reactApp.map.entity.converter.pageToGlobal([this.X, this.Y]), this.reactApp.map.entity.getZoom()));

            this.draw();
        }
    }


}
