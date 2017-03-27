import React, {Component} from 'react';
import _ from 'lodash';
import {
    numberFormat,
    Render,
    initWeekFilter,
    initSliderRange,
    initSliderStars,
    naturalSort
} from '../tools/tools'
import {Scrollbars} from 'react-custom-scrollbars';
import {Loader} from './loader';
import Slider from 'react-slick';
import moment from 'moment';

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
            filter: {
                active: false,
                priceFrom: 10000,
                priceMin: 10000,
                priceTo: 800000,
                priceMax: 800000,
                sort: 'asc',
                expandedBlock: null,
                arRegions: ["Адлер", "Дагомыс"],
            },
            arAllRegions: [],
            curDate: window.RuInturistStore.initForm.dateFrom,
            dates: this.getDatesList(),
        };

        this.NTK_API_IN = window.RuInturistStore.NTK_API_IN;
        this.LL_API_IN = window.RuInturistStore.LL_API_IN;

        this.ajaxUrl = '/tour-search/ajax.php';

        this.LTMaxChkNum = 3; // максимальное количество запросов к ЛЛ
        this.LTChkTimeOut = 4 * 1000; // интервал проверки результатов ЛТ
        this.itemsPerPage = 25; // кол-во элементов на стр

        this.NTK_PACk_TYPES = window.RuInturistStore.NTK_PACk_TYPES;

        this.mapZoom = 7;
        this.mapCenter = [55.031284, 44.459611];
        this.mapMarker = '/local/tpl/dist/static/i/icon-map.png';
        this.mapMarkerHover = '/local/tpl/dist/static/i/icon-map-orange.png';

        this.arXHRs = [];

        this.mapTrigger = this.mapTrigger.bind(this);
        this.renderButtonClick = this.renderButtonClick.bind(this);
        this.onScrollBottonClick = this.onScrollBottonClick.bind(this);
        this.filterToggle = this.filterToggle.bind(this);
        this.resultsHandler = this.resultsHandler.bind(this);


        //console.log('=====================================');
        //console.log('NTK_PACk_TYPES: ', this.NTK_PACk_TYPES);
        //console.log('LL_API_IN: ', this.LL_API_IN);
        //console.log('=====================================');

        this.map = {
            inited: false,
            polygon: null,
            entity: null,
        }

    }


    setRegion(region){

        console.log('click: setRegion: ', region);

        let arRegions = [];

        if(region){

            arRegions = [...this.state.filter.arRegions];
            let idx = arRegions.indexOf(region);

            if(-1 === idx){
                arRegions.push(region);
            }else{
                arRegions = [
                    ...arRegions.slice(0, idx),
                    ...arRegions.slice(idx + 1, arRegions.length)
                ]
            }
        }

        this.setState({
            filter: Object.assign({}, this.state.filter, {arRegions: arRegions})
        });

    }

    setSort(e, sort){
        e.stopPropagation();
        this.setState({
            filter: Object.assign({}, this.state.filter, {sort: sort})
        })
    }
    
    getDatesList(){
        moment.lang('ru');
        let dateFrom = window.RuInturistStore.initForm.dateFrom;
        if(!dateFrom) return {};

        let momentDate = moment(dateFrom, 'DD.MM.YYYY').add(-4, 'day');

        let dates = {};


        for(let i = 0; i<=6; i++){

            let date2add = momentDate.add(1, 'day');
            const dateRaw = date2add.format('DD.MM.YYYY');

            dates[dateRaw] = {
                ts: +date2add.format('X'),
                dateRaw: dateRaw,
                dayOfWeek: date2add.format('dddd'),
                dayAndMonth: date2add.format('D MMMM'),
            };
        }
        
        
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('dates: ', dates);
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        return dates;
    }

    filterBlockToggle(blockId){
        this.setState({
            filter: Object.assign({}, this.state.filter, {expandedBlock: blockId})
        });

    }

    componentDidMount() {
        this.getNtkHotelList();
    }

    filterToggle() {
        this.setState({
            filter: Object.assign({}, this.state.filter, {active: !this.state.filter.active})
        });
    }

    onWeekFilterClick(curDate){

        this.setState({curDate});

        if(this.state.coordinates.length){
            this.renderButtonClick();
        }

        const {scrollbars} = this.refs;
        scrollbars.scrollTop(0);
    }

    onScrollBottonClick() {

        const {scrollbars} = this.refs;
        const scrollHeight = scrollbars.getScrollHeight();
        const cartHeight = 259;
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
                $[[options.contentLayout ]]
                 
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
            <div class="balloon__content">
                <div class="balloon-price">Цена от:  {{properties.price}} <span class="rub">Р</span></div>
                <div class="balloon-destination">{{properties.descr}}</div>
                <div class="icon-icon-location-blue"></div>
            </div>`, {});

        search.map((item) => {

            if (!(this.state.HOTELS_INFO && this.state.HOTELS_INFO[item.HOTEL_INFO_ID] && this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS)) {
                return;
            }

            let point = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS;

            point = point.split(',');

            if (this.state.coordinates.length && (this.map.polygon && !this.map.polygon.geometry.contains([point[0], point[1]]))) {
                return;
            }


            let price = numberFormat(item.Price, 0, ',', ' ');

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
                descr: this.state.HOTELS_INFO[item.HOTEL_INFO_ID].LOCATION.join(', '),
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
                .add('mouseenter', (e) => {
                    e.get('target').options.set('iconImageHref', this.mapMarkerHover);
                })
                .add('mouseleave', (e) => {
                    e.get('target').options.set('iconImageHref', this.mapMarker);
                });
        });

        this.map.entity.geoObjects.add(this.map.collection);


        const bounds = this.map.entity.geoObjects.getBounds();

        if (bounds) {
            this.map.entity.setBounds(bounds, {checkZoomRange: true});
        }


    }


    componentDidUpdate() {
        initSliderRange(this);
        initSliderStars();
        initWeekFilter();

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

                        //console.log('=========================');
                        //console.log('NTK_API_IN: ', NTK_API_IN);
                        //console.log('=========================');

                        let minServices = '';
                        if (+NTK_API_IN['FlightType'] == 1) {
                            minServices = 'перелет, проживание';
                        } else if (+NTK_API_IN['FlightType'] == 2) {
                            minServices = 'проживание';
                        } else if (0) { // todo - жд перевозки
                            minServices = '';
                        }

                        for (let key in data.SEARCH) {
                            let hotelInfo = this.state.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID] || data.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID];
                            if(!hotelInfo){
                                delete data.SEARCH[key];
                                continue;
                            }


                            data.SEARCH[key].minServices = minServices;
                            data.SEARCH[key].Price = +data.SEARCH[key].Price


                        }

                        let obSearch = {};

                        if (+pack['FlightType'] === 2) { // туры с перелетом перекрывают то что уже получено
                            obSearch = Object.assign({}, data.SEARCH, this.state.SEARCH);
                        } else {
                            obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                        }

                        let hotelsInfo = Object.assign({}, this.state.HOTELS_INFO, data.HOTELS_INFO);

                        this.resultsHandler(obSearch, hotelsInfo);


                        this.setState({
                            SEARCH: obSearch,
                            HOTELS_INFO: hotelsInfo,
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

    resultsHandler(obSearch, hotelsInfo) {

        console.log('handle results');
        console.log('obSearch: ', obSearch);
        console.log('hotelsInfo: ', hotelsInfo);

        let priceMin = this.state.filter.priceFrom;
        let priceMax = 0;
        let dates = Object.assign({}, this.state.dates);


        for (let key in obSearch) {
            if (obSearch[key].Price < priceMin) priceMin = obSearch[key].Price;
            if (obSearch[key].Price > priceMax) priceMax = obSearch[key].Price;

            if(
                dates[obSearch[key].HotelLoadDate] &&
                (!dates[obSearch[key].HotelLoadDate].Price || dates[obSearch[key].HotelLoadDate].Price > obSearch[key].Price)
            ){
                dates[obSearch[key].HotelLoadDate].Price = obSearch[key].Price;
            }

        }

        if(Object.keys(dates).length){
            for (let key in dates){

                let printPrice;

                if (dates[key].Price){
                    printPrice = (
                        <div className="tour-week__filter__item__price">от <span>{numberFormat(dates[key].Price, 0, '', ' ')} р</span></div>
                    )
                }else{
                    printPrice = <div className="tour-week__filter__item__price">Нет туров</div>;
                }

                dates[key].printPrice = printPrice;
            }
        }


        let arAllRegions = [...this.state.arAllRegions];
        for (let key in hotelsInfo){
            if(hotelsInfo[key].LOCATION[1]){
                arAllRegions.push(hotelsInfo[key].LOCATION[1]);
            }
        }

        arAllRegions = _.uniq(arAllRegions);
        arAllRegions = naturalSort(arAllRegions);

        // at the end
        this.setState({
            filter: Object.assign({}, this.state.filter, {
                priceFrom: priceMin,
                priceMin: priceMin,
                priceTo: priceMax,
                priceMax: priceMax,
            }),
            dates: Object.assign({}, dates),
            arAllRegions: arAllRegions,
        });


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


    onHotelMouseEnter(hotelId) {
        const marker = this.map.markers[hotelId];
        if (!marker) return;
        marker.options.set({iconImageHref: this.mapMarkerHover, zIndex: 9999999999});
        this.map.entity.setCenter(marker.geometry.getCoordinates());
    }

    onHotelMouseLeave(hotelId) {
        const marker = this.map.markers[hotelId];
        if (!marker) return;
        marker.options.set({iconImageHref: this.mapMarker, zIndex: 999999999});
    }


    renderHotels(search = []) {

        let sliderSetting = {
            accessibility: false,
            dots: false,
            arrows: true,
            fade: true,
            className: 'carousel carousel-in',
        };

        let hotels = search.map((hotel, idx) => {

            let hotelInfo = this.state.HOTELS_INFO[hotel.HOTEL_INFO_ID];
            const priceForPrint = numberFormat(+hotel.Price, 0, '', ' ',);
            let images = hotelInfo.IMAGES || [];


            return (
                <li className="list__item"
                    key={idx}
                    onMouseEnter={() => this.onHotelMouseEnter(hotel.HOTEL_INFO_ID)}
                    onMouseLeave={() => this.onHotelMouseLeave(hotel.HOTEL_INFO_ID)}
                >
                    <div className="row hotel-card">
                        <div className="hotel-card__actions">
                            {hotelInfo.HP ?
                                <div className="hot-price show-description">
                                    <span className="icon-hotprice"></span>
                                    <div className="description">Горячая цена</div>
                                </div>
                                : ''}
                            {hotelInfo.FA ?
                                <div className="confirmation show-description">
                                    <span className="icon-statim"></span>
                                    <div className="description">Моментальное подтверждение</div>
                                </div>
                                : ''}
                        </div>

                        <div className="col__left hotel-card__image">
                            {images.length ?
                                <Slider {...sliderSetting}>
                                    {images.map((img, idx) => <div className="carousel__item" key={idx}><img src={img}/></div>)}
                                </Slider>
                                : ''}
                        </div>
                        <div className="col__middle hotel-card__content">
                            <div className="rating left -star-4"></div>
                            <span className="icon-addfavorite right"></span>
                            <span className="icon-newsletter right"></span>

                            <h5 className="hotel-card__title" title={hotelInfo.NAME}>{hotelInfo.NAME}</h5>
                            <div
                                className="hotel-card__location">{`${hotel.HOTEL_INFO_ID} - ${hotelInfo.LOCATION.join(', ')}`}</div>

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
        });

        return hotels;
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


    renderFilter() {

        const {filter} = this.state;

        let filterHeaderCls = ' tour-addit__filter__top ';
        if (filter.active) filterHeaderCls += ' active ';

        return (
            <div className="tour-filter__wrap tour-filter__wrap__bottom">
                <div className="row inner">
                    {this.renderDates()}
                    <div className="region-right col__left -col-35">
                        <div className="tour-addit__filter">
                            <div className={filterHeaderCls} onClick={this.filterToggle}>
                                {filter.active ?
                                    <div className="tour-addit__filter__top__inner filter-active">
                                        <span className="icon-tube"></span>
                                        <span className="center">
                                            <span className="text">Выбрано фильтров: 5</span>
                                            <a className="clear-filters" href="#">Очистить фильтры</a>
									    </span>
                                        <span className="icon-arrow-up"></span>
                                    </div>
                                    :
                                    <div className="tour-addit__filter__top__inner filter-default">
                                        <span className="icon-tube"></span>
                                        <span className="text">Дополнительные фильтры</span>
                                        <span className="icon-arrow-down"></span>
                                    </div>
                                }
                            </div>
                            {this.renderFilterBody()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderDates(){

        let arDates = Object.values(this.state.dates).sort((i, j) => i.ts - j.ts);

        if(!arDates.length) return;
        
        //console.log('=======================');
        //console.log('this.state.dates: ', this.state.dates);
        //console.log('arDates: ', arDates);


        return (
            <div className="region-left col__left -col-60">
                <div className="tour-week__filter">
                {arDates.map( (date, idx) => {
                    return (
                        <div className="tour-week__filter__item"
                             onClick={() => this.onWeekFilterClick(date.dateRaw)}
                             key={idx} >
                            <div className="tour-week__filter__item__day">{date.dayOfWeek}</div>
                            <div className="tour-week__filter__item__date">{date.dayAndMonth}</div>
                            {date.printPrice}
                        </div>
                    )
                })}
                </div>

            </div>
        )
    }

    renderFilterBody() {
        const {filter} = this.state

        if (!filter.active) return;

        const {
            expandedBlock,
            sort,
            arRegions,
        } = filter;
        
        return (
            <div className="tour-addit__filter__dropdown">
                <div className="tour-addit__filter__dropdown__inner">
                    <div className="block-inline block-inline__top">
                        <h5>Диапазон цен</h5>
                        <div className="tour-filter__range">
											<span className="first">
												<span className="pre-text">от</span>
												<span className="js-sider-range-text-from-1"></span>
												<span className="rub">P</span>
											</span>
                            <span className="last">
												<span className="pre-text">до</span>
												<span className="js-sider-range-text-to-1"></span>
												<span className="rub">P</span>
											</span>
                        </div>
                        <div className="slider-range" data-index="1" data-min={filter.priceMin}
                             data-max={filter.priceMax}
                             data-step="1000" data-from={filter.priceFrom} data-to={filter.priceTo}></div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'sorting' ? ' expanded ' :'')}
                         onClick={(e) => this.filterBlockToggle(e, 'sorting')}
                    >
                        <div className="block-inline__collapse__top">
                            <h5>Сортировать по: цене</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>

                        <div className="block-collapse__bottom">
                            <div className="block-checkbox" onClick={(e) => this.setSort(e, 'asc')}>
                                <label className="label-checkbox" htmlFor="price-asc">
                                    <input type="radio"
                                           readOnly
                                           checked={sort === 'asc'}/>
                                    <span className="text">Сортировать от меньшей цены к большей</span>
                                </label>
                            </div>
                            <div className="block-checkbox" onClick={(e) => this.setSort(e, 'desc')}>
                                <label className="label-checkbox" htmlFor="price-desc">
                                    <input type="radio"
                                           readOnly
                                           checked={sort === 'desc'}/>
                                    <span className="text">Сортировать от большей цены к меньшей</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'operator' ? ' expanded ' :'')}
                    >
                        <div className="block-inline__collapse__top"
                             onClick={(e) => this.filterBlockToggle(e, 'operator')}
                        >
                            <h5>Туроператор</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="block-checkbox">
                                <label className="label-checkbox">
                                    <input type="checkbox"/>
                                    <span className="text">Все туроператоры</span>
                                </label>
                            </div>
                            <div className="block-checkbox grey">
                                <label className="label-checkbox">
                                    <input type="checkbox"/>
                                    <span className="text">Только НТК Интурист</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'regions' ? ' expanded ' :'')}
                    >
                        <div className="block-inline__collapse__top"
                             onClick={() => this.filterBlockToggle('regions')}
                        >
                            <h5>Регионы</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="block-checkbox" onClick={() => this.setRegion(null)}>
                                <label className="label-checkbox">
                                    <input type="checkbox" checked={!arRegions.length}/>
                                    <span className="text">Все регионы</span>
                                </label>
                            </div>
                            {this.state.arAllRegions.map((region, idx) => {
                                return (
                                    <div className="block-checkbox" key={idx}>
                                        <label className="label-checkbox">
                                            <input type="checkbox"
                                                   onChange={() => this.setRegion(region)}
                                                   checked={-1 !== arRegions.indexOf(region)}/>
                                            <span className="text">{region}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'stars' ? ' expanded ' :'')}
                    >
                        <div className="block-inline__collapse__top"
                             onClick={(e) => this.filterBlockToggle(e, 'stars')}
                        >
                            <h5>Количество звезд</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="tour-filter__range">
                                <div className="stars">
                                    <span className="star-0">0 <i className="icon-star"></i></span>
                                    <span className="star-1">1 <i className="icon-star"></i></span>
                                    <span className="star-2">2 <i className="icon-star"></i></span>
                                    <span className="star-3">3 <i className="icon-star"></i></span>
                                    <span className="star-4">4 <i className="icon-star"></i></span>
                                    <span className="star-5">5 <i className="icon-star"></i></span>
                                </div>
                            </div>
                            <div className="slider-stars" data-min="0" data-max="5" data-step="1"
                                 data-from="3"></div>
                        </div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'service' ? ' expanded ' :'')}>
                        <div className="block-inline__collapse__top"
                             onClick={(e) => this.filterBlockToggle(e, 'service')}
                        >
                            <h5>Удобства</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            Контент
                        </div>
                    </div>
                    <div className="block-inline block-inline__collapse"
                         onClick={(e) => this.filterBlockToggle(e, 'shore')}
                    >
                        <div className="block-inline__collapse__top">
                            <h5>Расстояние до пляжа</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            Контент
                        </div>
                    </div>
                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'resttype' ? ' expanded ' :'')}>
                        <div className="block-inline__collapse__top"
                             onClick={(e) => this.filterBlockToggle(e, 'resttype')}
                        >
                            <h5>Тип отдыха</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            Контент
                        </div>
                    </div>
                </div>
                <div className="block-inline block-clear-filters">
                    <a className="clear-filters" href="#">Очистить фильтры</a>
                </div>
            </div>
        );
    }


    render() {

        const mapTriggerLabel = this.state.isMapWide ? 'Скрыть' : 'Развернуть';
        const mapTriggerIcon = this.state.isMapWide ? 'icon-arrow-right' : 'icon-arrow-left';
        const mapTriggerWpCls = this.state.isMapWide ? 'tour-search__map__hide expand' : 'tour-search__map__hide ';
        const tourSearchMap = this.state.isMapWide ? 'col__right tour-search__map' : 'col__right tour-search__map small';
        const canvasCls = this.state.isRender ? 'canvas-opened' : 'canvas-closed';

        const {filter} = this.state;

        let renderButtonCaption = 'Обвести';

        if (this.state.isRender) {
            renderButtonCaption = 'Отменить';

        } else if (this.state.coordinates.length) {
            renderButtonCaption = 'Очистить';
        }

        const tourSearchResult = this.state.isMapWide ? 'col__middle tour-search__results' : 'col__middle tour-search__results wide';

        let search = Object.values(this.state.SEARCH);

        search = search.filter(i => +i.Price > 0);


        // фильтро по обводке
        if (this.state.coordinates.length) {
            search = search.filter(i => this.map.markers[i.HOTEL_INFO_ID])
        }

        search = search.filter(i => {
            return (
                (i.Price >= filter.priceFrom && i.Price <= filter.priceTo) &&
                (i.HotelLoadDate === this.state.curDate)
            )
        });

        // ФИЛЬТР ПО РЕГИОНАМ
        if(this.state.filter.arRegions.length){
            search = search.filter(i => {
                const hotelInfo = this.state.HOTELS_INFO[i.HOTEL_INFO_ID];
                return hotelInfo && hotelInfo.LOCATION[1] && -1 !== this.state.filter.arRegions.indexOf(hotelInfo.LOCATION[1]);
            });
        }

        // отрисовка точек только после всех фильтров
        if (!this.state.isRender) {
            this.renderMapPoints(search);
        }

        search = search.sort((i, j) => {
            if(this.state.filter.sort == 'asc') return i.Price - j.Price;
            if(this.state.filter.sort == 'desc') return j.Price - i.Price;
        });

        return (
            <div className="inner">
                {this.renderFilter()}
                <div className="row">
                    <div className="col__left -col-60 content-region-left">
                        <h2>Поиск тура: найдено предложений: {search.length}</h2>
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