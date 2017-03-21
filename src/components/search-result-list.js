import React, {Component} from 'react';
import {number_format, Render} from '../tools/tools'
import {Scrollbars} from 'react-custom-scrollbars';

console.log('Render: ', Render);


export default class SearchResultList extends Component {

    constructor(props) {
        console.log('SearchResultList constructor');
        super(props);

        this.state = {
            page: 1,
            arXHR: [],
            isRender: true,


            SEARCH: {},
            HOTELS_INFO: {},
            USER_FAV: [],
            isMapWide: true,
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


    }

    componentDidMount() {

        //this.getNtkHotelList();

        this.initMap();

        Render.init({
            object: this,
            canvas: this.refs.canvas
        });

    }

    initMap() {
        //Set coordinates
        var latlng = new google.maps.LatLng(36.469167, 32.115);

        //Set map options
        var options = {
            center: latlng,
            zoom: 15,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        //Create styled and normal map
        var map = new google.maps.Map(document.getElementById('map'), options);

        //Create InfoWindow
        var infowindow = new google.maps.InfoWindow({
            content: '<b>Офис продаж</b><br><address>Москва, Лукоянов, ул. Пушкина, дом 59, корп.В</address>'
        });

        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            animation: google.maps.Animation.DROP,
            icon: '/local/tpl/dist/static/i/icon-map.png'
        });

        //Open InfoWindow
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });


    };

    renderButtonClick() {
        this.setState({
            isRender: !this.state.isRender,
        });
    }

    componentDidUpdate() {

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

    mapTrigger() {
        this.initMap();
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

    renderHotels() {

        let search = Object.values(this.state.SEARCH);

        search.filter(i => +i.Price > 0);
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
        const renderButtonCaption = this.state.isRender ? 'Отменить' : 'Обвести';

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
                                        <div style={{zIndex: 101}} className={mapTriggerWpCls}
                                             onClick={this.mapTrigger}><span className={mapTriggerIcon}></span><span
                                            className="label">{mapTriggerLabel}</span></div>
                                        <div
                                            style={{zIndex: 101}}
                                            onClick={this.renderButtonClick}
                                            className="tour-search__map__draw"><span>{renderButtonCaption}</span>
                                        </div>
                                        <canvas
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
                                        <div id="map" style={{overflow: 'visible', minHeight: '500px'}}></div>

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
                                            {this.renderHotels()}
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
