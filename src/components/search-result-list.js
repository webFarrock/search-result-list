import React, {Component} from 'react';
import {number_format, Render, carouselInit} from '../tools/tools'
import {Scrollbars} from 'react-custom-scrollbars';

console.log('Render: ', Render);


export default class SearchResultList extends Component {

    constructor(props) {
        console.log('SearchResultList constructor');
        super(props);

        this.state = {
            page: 1,
            arXHR: [],
            isRender: false,
            coordinates: [],
            yandexMapInited: false,


            SEARCH: {},
            HOTELS_INFO: {},
            USER_FAV: [],
            isMapWide: false,
            //SEARCH_RAW: {},
            //isLoading: true,
            //isLoadingLT: true,
            //chkLTResNum: 0,
            //ltUsedOperators: [],
            //completedRequests: {},
            //boundsFirst: true,
            //isBtnOn: false,

        };

        this.NTK_API_IN = window.RuInturistStore.NTK_API_IN;
        this.LL_API_IN = window.RuInturistStore.LL_API_IN;

        this.ajaxUrl = '/tour-search/ajax.php';

        this.LTMaxChkNum = 3; // максимальное количество запросов к ЛЛ
        this.LTChkTimeOut = 4 * 1000; // интервал проверки результатов ЛТ
        this.itemsPerPage = 25; // кол-во элементов на стр

        this.NTK_PACk_TYPES = window.RuInturistStore.NTK_PACk_TYPES;


        this.arXHRs = [];

        this.mapTrigger = this.mapTrigger.bind(this);
        this.renderButtonClick = this.renderButtonClick.bind(this);

        console.log('=====================================');
        console.log('NTK_PACk_TYPES: ', this.NTK_PACk_TYPES);
        console.log('LL_API_IN: ', this.LL_API_IN);
        console.log('=====================================');

        this.map = {
            inited: false,
            polygon: null,
            entity: null,
        }

    }

    componentDidMount() {

        this.getNtkHotelList();


    }

    initMap() {
        if (!ymaps) return;

        if (this.map.inited) return;

        try {

            this.map.entity = new ymaps.Map("map", {
                center: [55.031284, 44.459611],
                zoom: 7,
                controls: ['zoomControl']
            }, {suppressMapOpenBlock: true});

            this.map.inited = true;
            this.setState({yandexMapInited: true})

        } catch (e) {
            console.warn('initMap error: ', e);
        }
    }

    renderButtonClick() {

        Render.erase();
        this.map.entity.geoObjects.remove(this.map.polygon);

        if (this.state.coordinates.length) {
            this.setState({
                isRender: false,
                coordinates: [],
            });
        } else {
            this.setState({
                isRender: !this.state.isRender,
            });
        }

    }

    renderMapPoints(search) {


        if (!this.state.yandexMapInited) return;

        if (this.map.collection) {
            this.map.collection.removeAll();
        } else {
            this.map.collection = new ymaps.GeoObjectCollection();
        }

        let MyBalloonLayout = ymaps.templateLayoutFactory.createClass(
            '<div class="balloon hoteldetail" data-href="$[properties.hotelLink]" >' +
            '<div class="balloon__header">' +
            '<a href="#" class="balloon__close close">&times;</a>' +
            '<b>$[properties.hotelName]</b>' +
            '$[properties.hotelStarHtml]' +
            '</div>' +
            '<div class="balloon__content">' +
            '$[[options.contentLayout ]]' +
            '</div>' +
            '<div class="arrow"></div>' +
            '</div>', {

                /**
                 * Строит экземпляр макета на основе шаблона и добавляет его в родительский HTML-элемент.
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/layout.templateBased.Base.xml#build
                 * @function
                 * @name build
                 */
                build: function () {
                    this.constructor.superclass.build.call(this);

                    this._$element = $('.balloon', this.getParentElement());

                    this.applyElementOffset();

                    this._$element.find('.close')
                        .on('click', $.proxy(this.onCloseClick, this));
                },

                /**
                 * Удаляет содержимое макета из DOM.
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/layout.templateBased.Base.xml#clear
                 * @function
                 * @name clear
                 */
                clear: function () {
                    this._$element.find('.close')
                        .off('click');

                    this.constructor.superclass.clear.call(this);
                },

                /**
                 * Метод будет вызван системой шаблонов АПИ при изменении размеров вложенного макета.
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/IBalloonLayout.xml#event-userclose
                 * @function
                 * @name onSublayoutSizeChange
                 */
                onSublayoutSizeChange: function () {
                    MyBalloonLayout.superclass.onSublayoutSizeChange.apply(this, arguments);

                    if (!this._isElement(this._$element)) {
                        return;
                    }

                    this.applyElementOffset();

                    this.events.fire('shapechange');
                },

                /**
                 * Сдвигаем балун, чтобы "хвостик" указывал на точку привязки.
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/IBalloonLayout.xml#event-userclose
                 * @function
                 * @name applyElementOffset
                 */
                applyElementOffset: function () {
                    this._$element.css({
                        left: -(this._$element[0].offsetWidth / 2),
                        top: -(this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight)
                    });
                },

                /**
                 * Закрывает балун при клике на крестик, кидая событие "userclose" на макете.
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/IBalloonLayout.xml#event-userclose
                 * @function
                 * @name onCloseClick
                 */
                onCloseClick: function (e) {
                    e.preventDefault();

                    this.events.fire('userclose');
                },

                /**
                 * Используется для автопозиционирования (balloonAutoPan).
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ILayout.xml#getClientBounds
                 * @function
                 * @name getClientBounds
                 * @returns {Number[][]} Координаты левого верхнего и правого нижнего углов шаблона относительно точки привязки.
                 */
                getShape: function () {
                    if (!this._isElement(this._$element)) {
                        return MyBalloonLayout.superclass.getShape.call(this);
                    }

                    var position = this._$element.position();

                    return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
                        [position.left, position.top], [
                            position.left + this._$element[0].offsetWidth,
                            position.top + this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight
                        ]
                    ]));
                },

                /**
                 * Проверяем наличие элемента (в ИЕ и Опере его еще может не быть).
                 * @function
                 * @private
                 * @name _isElement
                 * @param {jQuery} [element] Элемент.
                 * @returns {Boolean} Флаг наличия.
                 */
                _isElement: function (element) {
                    return element && element[0] && element.find('.arrow')[0];
                }
            });

        var BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
            `
            <div class="ballon-in-wp">
                <p>Цена: <b>{{properties.price}} Р</b></p>
                <p>{{properties.descr}}</p>
                <!--<div id="wheel" class="wheel-on-map-ballon">
                    <div id="uiThrobber" class="momondo-wheel momondo-wheel--spinning">
                        <svg height="90%" viewBox="0 0 20 20" width="90%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient gradientUnits="userSpaceOnUse" id="b" x2="3" y1="3" y2="3">
                                    <stop stop-color="#fcb913" offset="0"></stop>
                                    <stop stop-color="#fbac15" offset=".07"></stop>
                                    <stop stop-color="#f57a1b" offset=".37"></stop>
                                    <stop stop-color="#f15620" offset=".64"></stop>
                                    <stop stop-color="#ef4023" offset=".86"></stop>
                                    <stop stop-color="#ee3824" offset="1"></stop>
                                </linearGradient>

                                <linearGradient gradientUnits="userSpaceOnUse" id="c" x2="3" y1="3" y2="3">
                                    <stop stop-color="#48c3d6" offset="0"></stop>
                                    <stop stop-color="#42bbd3" offset=".17"></stop>
                                    <stop stop-color="#32a6ca" offset=".44"></stop>
                                    <stop stop-color="#1784bb" offset=".76"></stop>
                                    <stop stop-color="#0067ae" offset="1"></stop>
                                </linearGradient>

                                <linearGradient gradientUnits="userSpaceOnUse" id="d" x2="3" y1="3" y2="3">
                                    <stop stop-color="#E84698" offset="0"></stop>
                                    <stop stop-color="#E64392" offset=".18"></stop>
                                    <stop stop-color="#E23C82" offset=".41"></stop>
                                    <stop stop-color="#DB3166" offset=".68"></stop>
                                    <stop stop-color="#D12040" offset=".97"></stop>
                                    <stop stop-color="#D01F3D" offset="1"></stop>
                                </linearGradient>
                            </defs>
                            <g class="petals">
                                <path fill="#5298c9" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(300 1.57 10)"></path>
                                <path fill="#4b91c4" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(330 1.57 10)"></path>
                                <path fill="#448bbf" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(0 1.57 10)"></path>
                                <path fill="#3c83b9" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(30 1.57 10)"></path>
                                <path fill="#347bb3" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(60 1.57 10)"></path>
                                <path fill="#2a70ac" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(90 1.57 10)"></path>
                                <path fill="#2167a3" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(120 1.57 10)"></path>
                                <path fill="#2369a5" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(150 1.57 10)"></path>
                                <path fill="#1b619f" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(180 1.57 10)"></path>
                                <path fill="#185e9c" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(210 1.57 10)"></path>
                                <path fill="#125896" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(240 1.57 10)"></path>
                                <path fill="#0d5494" d="M.123.104C.047.117-.01.187 0 .266l.95 6.142c.006.054.054.1.12.088.347-.046.666-.046 1.01 0 .066 0 .114-.023.118-.09l.948-6.13C3.16.18 3.104.115 3.013.102c-.972-.14-1.95-.136-2.89 0z" transform="translate(8.43) rotate(270 1.57 10)"></path>
                            </g>
                        </svg>
                    </div>

                </div>--> 
            </div>
            `, {});

        this.map.markers = [];
        
        
        search.map((item) => {
             
            if (!(this.state.HOTELS_INFO && this.state.HOTELS_INFO[item.HOTEL_INFO_ID] && this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS)) {
                console.log('this.state.HOTELS_INFO[item.HOTEL_INFO_ID] ',this.state.HOTELS_INFO[item.HOTEL_INFO_ID]);
                return;
            }

            let point = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS;

            console.log('point: ', point);

            point = point.split(',');

            if(this.state.coordinates.length && (this.map.polygon && !this.map.polygon.geometry.contains([point[0], point[1]]))){
                return;
            }


            let price = number_format(item.Price, 0, ',', ' ');

            let stars = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].STARS;
            let starsInt = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].STARS_INT;
            let starsHtml = '';

            if (starsInt > 0) {
                starsHtml = '<div class="rating -star-' + starsInt + '"></div>';
            } else if (starsInt == 0) {
                starsHtml = '';
            } else {
                starsHtml = <div class="rating_litera"> {stars} </div>
            }


            this.map.markers[item.HOTEL_INFO_ID] = new ymaps.Placemark([point[0], point[1]], {
                price: price,
                descr: this.state.HOTELS_INFO[item.HOTEL_INFO_ID].LOCATION,
                hotelName: this.state.HOTELS_INFO[item.HOTEL_INFO_ID].NAME,
                hotelStarHtml: starsHtml,
                hotelLink: this.state.HOTELS_INFO[item.HOTEL_INFO_ID].DETAIL_LINK,
            }, {
                balloonContentLayout: BalloonContentLayout,
                balloonLayout: MyBalloonLayout,
                balloonPanelMaxMapArea: 0,
                iconLayout: 'default#image',
                iconImageHref: 'mark.png',
                iconImageSize: [22, 33],
                iconImageOffset: [-12, -42]
            });


            this.map.collection.add(this.map.markers[item.HOTEL_INFO_ID])

            this.map.markers[item.HOTEL_INFO_ID].events
                .add('mouseenter', function (e) {
                    e.get('target').options.set('iconImageHref', 'mark_hov.png');
                })
                .add('mouseleave', function (e) {
                    e.get('target').options.set('iconImageHref', 'mark.png');
                });


        });

        this.map.entity.geoObjects.add(this.map.collection);

        let bounds = this.map.entity.geoObjects.getBounds();

        if (bounds) {
            this.map.entity.setBounds(bounds, {checkZoomRange: true});
        }


    }

    componentDidUpdate() {

        carouselInit();


        this.initMap();


        if (this.state.yandexMapInited) {

            Render.init({
                reactApp: this,
                canvas: this.refs.canvas,
                projection: this.map.entity.options.get('projection'),
            });
        }


    }

    mapTrigger() {
        this.setState({isMapWide: !this.state.isMapWide});
    }

    getNtkHotelList() {

        if (this.NTK_API_IN.Destination) {
            this.NTK_PACk_TYPES.forEach((pack) => {
                const NTK_API_IN = {...this.NTK_API_IN, ...pack};

                let xhr = $.ajax({
                    url: this.ajaxUrl,
                    data: {
                        NTK_API_IN,
                        ajax: 'Y',
                    },
                    dataType: 'json',
                    cache: false,
                    beforeSend: () => {
                        console.log('before send ajax');
                    },
                }).done(data => {

                    if (data && data.SEARCH instanceof Object) {

                        let minServices = '';
                        if (+NTK_API_IN['FlightType'] == 1) {
                            minServices = 'перелет, проживание';
                        } else if (+NTK_API_IN['FlightType'] == 2) {
                            minServices = 'проживание';
                        } else if (0) { // todo - жд перевозки
                            minServices = '';
                        }


                        for (let key in data.SEARCH) {
                            data.SEARCH[key].minServices = minServices;
                        }

                        let obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                        this.setState({
                            SEARCH: obSearch,
                            HOTELS_INFO: Object.assign({}, this.state.HOTELS_INFO, data.HOTELS_INFO),
                            USER_FAV: [].concat(data.USER_FAV, this.state.USER_FAV),
                            //isLoading: false
                        });
                    }
                });

                this.arXHRs.push(xhr);

                this.setState({
                    arXHR: [].concat(this.arXHRs)
                });

            });
        }


    }

    renderAttrs(attrs) {

        let output = [];


        if (attrs instanceof Object) {
            for (var key in attrs) {
                output.push(
                    <span key={key} className={key} title={attrs[key].join(', ')}></span>
                )
            }
        }

        if (output.length) {
            output = output.slice(0, 5);
            return (
                <div className="hotel-option">{output}</div>
            );
        }

    }

    renderHotels(search = []) {

        return search.map((hotel, idx) => {
            let hotelInfo = this.state.HOTELS_INFO[hotel.HOTEL_INFO_ID];

            if (hotelInfo) {
                const priceForPrint = number_format(+hotel.Price, 0, '', ' ',);

                return (
                    <li className="list__item" key={idx}>
                        <div className="row hotel-card">
                            <div className="hotel-card__actions">
                                <div className="hot-price show-description">
                                    <span className="icon-hotprice"></span>
                                    <div className="description">Горячая цена</div>
                                </div>
                                <div className="confirmation show-description">
                                    <span className="icon-statim"></span>
                                    <div className="description">Моментальное подтверждение</div>
                                </div>
                            </div>

                            <div className="col__left hotel-card__image">
                                <div className="carousel carousel-in">
                                    {hotelInfo.IMAGES.map((img, idx) => <div className="carousel__item" key={idx}><img
                                        src={img}/></div>)}
                                </div>
                            </div>
                            <div className="col__middle hotel-card__content">
                                <div className="rating left -star-4"></div>
                                <span className="icon-addfavorite right"></span>
                                <span className="icon-newsletter right"></span>

                                <h5 className="hotel-card__title" title={hotelInfo.NAME}>{hotelInfo.NAME}</h5>
                                <div className="hotel-card__location">{hotelInfo.LOCATION}</div>

                                {this.renderAttrs(hotelInfo.arPreparedAttrs)}

                                <div className="hotel-card__service">{hotel.minServices}</div>

                                <div className="world-rating"></div>

                                <a href="" className="button buy">
                                <span className="buy-wrapper">
                                    <span className="price"><i>от</i> {priceForPrint} <span
                                        className="rub">Р</span></span>
                                </span>
                                </a>
                            </div>
                        </div>
                    </li>
                );
            }

        });

    }

    onCanvasMouseMove(e) {
        Render.findxy('move', 'mouse', e);
    }

    onCanvasMouseDown(e) {
        Render.findxy('down', 'mouse', e);
    }

    onCanvasMouseUp(e) {
        Render.findxy('up', 'mouse', e);
    }

    onCanvasMouseOut(e) {
        Render.findxy('out', 'mouse', e);
    }

    onCanvasTouchStart(e) {
        Render.findxy('down', 'touch', e);
    }

    onCanvasTouchMove(e) {
        Render.findxy('move', 'touch', e);
    }

    onCanvasTouchEnd(e) {
        Render.findxy('up', 'touch', e);
    }

    render() {

        const mapTriggerLabel = this.state.isMapWide ? 'Скрыть' : 'Развернуть';
        const mapTriggerIcon = this.state.isMapWide ? 'icon-arrow-right' : 'icon-arrow-left';
        const mapTriggerWpCls = this.state.isMapWide ? 'tour-search__map__hide expand' : 'tour-search__map__hide ';
        const tourSearchResult = this.state.isMapWide ? 'col__middle tour-search__results' : 'col__middle tour-search__results wide';
        const tourSearchMap = this.state.isMapWide ? 'col__right tour-search__map' : 'col__right tour-search__map small';
        const canvasCls = this.state.isRender ? 'canvas-opened' : 'canvas-closed';

        let renderButtonCaption = 'Обвести';

        console.log('render');

        console.log('this.state.isRender: ', this.state.isRender);
        console.log('this.state.coordinates.length: ', this.state.coordinates.length);

        if (this.state.isRender) {
            renderButtonCaption = 'Отменить';

        } else if (this.state.coordinates.length) {
            renderButtonCaption = 'Очистить';
        }


        let search = Object.values(this.state.SEARCH);

        search.filter(i => +i.Price > 0);

        this.renderMapPoints(search);

        return (
            <div className="inner">
                <div className="row">
                    <div className="col__left -col-60 content-region-left">
                        <h2>Поиск тура: найдено предложений: {Object.keys(this.state.SEARCH).length}</h2>
                    </div>
                </div>
                <div className="row">
                    <section className="col__middle section">
                        <div className="section__inner">

                            <div className="row tour-search">
                                <div className={tourSearchMap}>
                                    <div className="tour-search__map__wrap">
                                        <div id="map">
                                            <canvas
                                                id="canvas-on-map"
                                                onMouseMove={this.onCanvasMouseMove}
                                                onMouseDown={this.onCanvasMouseDown}
                                                onMouseUp={this.onCanvasMouseUp}
                                                onMouseOut={this.onCanvasMouseOut}
                                                onTouchStart={this.onCanvasTouchStart}
                                                onTouchMove={this.onCanvasTouchMove}
                                                onTouchEnd={this.onCanvasTouchEnd}
                                                className={canvasCls}
                                                ref="canvas"
                                            ></canvas>
                                        </div>

                                        <div style={{zIndex: 101}} className={mapTriggerWpCls}
                                             onClick={this.mapTrigger}><span className={mapTriggerIcon}></span><span
                                            className="label">{mapTriggerLabel}</span></div>
                                        <div
                                            style={{zIndex: 101}}
                                            onClick={this.renderButtonClick}
                                            className="tour-search__map__draw"><span>{renderButtonCaption}</span>
                                        </div>

                                    </div>

                                    <div className="balloon hoteldetail" data-href="" style={{display: 'none'}}>
                                        <div className="balloon__header">
                                            <a href="#" className="balloon__close close">×</a>
                                            <div className="balloon__header--title">Mantas Sea Side</div>
                                            <div className="rating -star-3"></div>
                                        </div>
                                        <div className="balloon__content">
                                            <div className="balloon-price">Цена от: 77 081 <span
                                                className="rub">Р</span></div>
                                            <div className="balloon-destination">Греция / Лутраки</div>

                                            <div className="icon-icon-location-blue"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className={tourSearchResult}>


                                    <ul className="list -inline tour-search__results__list scroll-content">
                                        <Scrollbars style={{height: 600}}>
                                            {this.renderHotels(search)}
                                        </Scrollbars>
                                    </ul>


                                    <div className="scroll-bottom">
                                        <span className="icon-arrow-bottom"></span>
                                    </div>


                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </div>

        );
    }

}
