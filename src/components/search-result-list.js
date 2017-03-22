import React, {Component} from 'react';
import {number_format, Render, carouselInit} from '../tools/tools'
import {Scrollbars} from 'react-custom-scrollbars';
import {Loader} from './loader';
//import {baloonLayout, baloonContentTemplate} from './baloon';

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
        };

        this.NTK_API_IN = window.RuInturistStore.NTK_API_IN;
        this.LL_API_IN = window.RuInturistStore.LL_API_IN;

        this.ajaxUrl = '/tour-search/ajax.php';

        this.LTMaxChkNum = 3; // максимальное количество запросов к ЛЛ
        this.LTChkTimeOut = 4 * 1000; // интервал проверки результатов ЛТ
        this.itemsPerPage = 25; // кол-во элементов на стр

        this.NTK_PACk_TYPES = window.RuInturistStore.NTK_PACk_TYPES;

        this.mapZoom = 7,
        this.mapCenter = [55.031284, 44.459611],


        this.arXHRs = [];

        this.mapTrigger = this.mapTrigger.bind(this);
        this.renderButtonClick = this.renderButtonClick.bind(this);
        this.onScrollBottonClick = this.onScrollBottonClick.bind(this);

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

    onScrollBottonClick() {

        const {scrollbars} = this.refs;
        const scrollHeight = scrollbars.getScrollHeight();
        const cartHeight = 255;
        const newVal = Math.round(scrollbars.getScrollTop() / cartHeight) * cartHeight + cartHeight;

        if (newVal < scrollHeight) {
            scrollbars.scrollTop(newVal);
        }

    }

    initMap() {

        console.log('--->initMap()');


        if (!ymaps) return;

        if (this.state.yandexMapInited) return;

        try {

            console.log('--->initMap() ->> try');

            this.map.entity = new ymaps.Map("map", {
                center: this.mapCenter,
                zoom: this.mapZoom,
                controls: ['zoomControl']
            }, {suppressMapOpenBlock: true});


            this.map.inited = true;
            this.setState({yandexMapInited: true});

        } catch (e) {
            //console.warn('initMap error: ', e);
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


        this.map.markers = [];


        var MyBalloonLayout = ymaps.templateLayoutFactory.createClass(`
            <div class="balloon hoteldetail" data-href="$[properties.hotelLink]" >
                <div class="balloon__header">
                    <a href="#" class="balloon__close close">×</a> 
                    <div class="balloon__header--title">$[properties.hotelName]</div>
                    $[properties.hotelStarHtml]
                </div>
                <div class="balloon__content">
                    $[[options.contentLayout ]]
                </div> 
            </div>`
            , {

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
                    left: -((this._$element[0].offsetWidth / 2) - 6 ),
                    top: -(this._$element[0].offsetHeight + 20 )
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
                        position.top + this._$element[0].offsetHeight + this._$element.find('.icon-icon-location-blue')[0].offsetHeight
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
                return element && element[0] && element.find('.icon-icon-location-blue')[0];
            }
        });

        var BalloonContentLayout = ymaps.templateLayoutFactory.createClass(`
                <div class="balloon-price">Цена от:  {{properties.price}} <span class="rub">Р</span></div>
                <div class="balloon-destination">{{properties.descr}}</div>
                <div class="icon-icon-location-blue "></div>  `, {});



        search.map((item) => {

            if (!(this.state.HOTELS_INFO && this.state.HOTELS_INFO[item.HOTEL_INFO_ID] && this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS)) {
                return;
            }

            let point = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS;

            point = point.split(',');

            if (this.state.coordinates.length && (this.map.polygon && !this.map.polygon.geometry.contains([point[0], point[1]]))) {
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
                iconImageHref: '/local/tpl/dist/static/i/icon-map.png',
                iconImageSize: [32, 47],
                iconImageOffset: [-12, -42]
            });


            this.map.collection.add(this.map.markers[item.HOTEL_INFO_ID]);

            this.map.markers[item.HOTEL_INFO_ID].events
                .add('mouseenter', function (e) {
                    e.get('target').options.set('iconImageHref', '/local/tpl/dist/static/i/icon-map-orange.png');
                })
                .add('mouseleave', function (e) {
                    e.get('target').options.set('iconImageHref', '/local/tpl/dist/static/i/icon-map.png');
                });
        });

        this.map.entity.geoObjects.add(this.map.collection);


        const bounds = this.map.entity.geoObjects.getBounds();

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

        this.setState({isMapWide: !this.state.isMapWide}, () => {
            if (this.map.entity) {

                console.log('--->fitToViewport()');

                this.map.entity.container.fitToViewport();

                let bounds = this.map.entity.geoObjects.getBounds();

                if (bounds) {
                    this.map.entity.setBounds(bounds, {checkZoomRange: true});
                }
            }
        });


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

                        console.log('=========================');
                        console.log('NTK_API_IN: ', NTK_API_IN);
                        console.log('=========================');

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

                        let obSearch = {};

                        if(+pack['FlightType'] === 2){ // туры с перелетом перекрывают то что уже получено
                            obSearch = Object.assign({}, data.SEARCH, this.state.SEARCH);
                        }else{
                            obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                        }


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

            if (this.state.coordinates.length) {
                if(!this.map.markers[hotel.HOTEL_INFO_ID]) return;
            }

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
        const tourSearchMap = this.state.isMapWide ? 'col__right tour-search__map' : 'col__right tour-search__map small';
        const canvasCls = this.state.isRender ? 'canvas-opened' : 'canvas-closed';

        let renderButtonCaption = 'Обвести';

        if (this.state.isRender) {
            renderButtonCaption = 'Отменить';

        } else if (this.state.coordinates.length) {
            renderButtonCaption = 'Очистить';
        }

        const tourSearchResult = this.state.isMapWide ? 'col__middle tour-search__results' : 'col__middle tour-search__results wide';

        let search = Object.values(this.state.SEARCH);

        search.filter(i => +i.Price > 0);




        if(!this.state.isRender){
            // избегаем перерисовки карты при включении обводки
            this.renderMapPoints(search);
        }

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

                                        {!this.state.yandexMapInited ? '' :
                                            <div style={{zIndex: 101}} className={mapTriggerWpCls}
                                                 onClick={this.mapTrigger}>
                                                <span className={mapTriggerIcon}></span>
                                                <span className="label">{mapTriggerLabel}</span>
                                            </div>}
                                        {!this.state.yandexMapInited ? '' : <div
                                            style={{zIndex: 101}}
                                            onClick={this.renderButtonClick}
                                            className="tour-search__map__draw"><span>{renderButtonCaption}</span>
                                        </div>}

                                    </div>
                                </div>

                                <div className={tourSearchResult}>


                                    <ul className="list -inline tour-search__results__list scroll-content">
                                        <Scrollbars
                                            ref="scrollbars"
                                            autoHeight
                                            autoHeightMin={600}
                                        >
                                            {this.renderHotels(search)}
                                        </Scrollbars>
                                    </ul>


                                    <div className="scroll-bottom" onClick={this.onScrollBottonClick}>
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
