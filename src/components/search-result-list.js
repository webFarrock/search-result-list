import React, {Component} from 'react';
import _ from 'lodash';
import {
    numberFormat,
    Render,
    initWeekFilter,
    initSliderRange,
    initSliderStars,
    naturalSort,
    deepEqual
} from '../tools/tools'
import {Scrollbars} from 'react-custom-scrollbars';
import {Loader} from './loader';
import Slider from 'react-slick';
import moment from 'moment';

export default class SearchResultList extends Component {

    constructor(props) {
        console.log('SearchResultList constructor');
        super(props);


        this.NTK_API_IN = window.RuInturistStore.NTK_API_IN;
        this.LL_API_IN = window.RuInturistStore.LL_API_IN;
        this.curDate = window.RuInturistStore.initForm.dateFrom
        this.ajaxUrl = '/tour-search/ajax.php';
        this.NTK_PACk_TYPES = window.RuInturistStore.NTK_PACk_TYPES;
        this.USER_FAV = window.RuInturistStore.USER_FAV || [];
        this.USER_FAV = this.USER_FAV.map(i => +i);

        this.LLMaxChkNum = 3; // максимальное количество запросов к ЛЛ
        this.LLChkTimeOut = 4 * 1000; // интервал проверки результатов ЛТ
        this.itemsPerPage = 25; // кол-во элементов на стр
        this.LLCompletedRequests = {};


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
            markers2add: [],
            markers:{},
        }

        this.services = [
            {name: 'Бассейн', className: 'icon-hotel-datailed-option-1'},
            {name: 'Бесплатный Wi-Fi', className: 'icon-hotel-datailed-option-4'},
            {name: 'Паркинг', className: 'icon-hotel-datailed-option-2'},
            {name: 'Спортзал', className: 'icon-hotel-datailed-option-5'},
            {name: 'Пляж', className: 'icon-hotel-datailed-option-9'},
            {name: 'Кондиционер', className: 'icon-hotel-datailed-option-6'},
            {name: 'Питомцы', className: 'icon-hotel-datailed-option-7'},
            {name: 'Медпункт', className: 'icon-hotel-datailed-option-8'},

        ]


        this.filterStartValue = {

            priceFrom: 10000,
            priceTo: 1000000,
            sort: 'asc',
            arRegions: [],
            onlyNTKOperator: false,
            starsFrom: 0,
            arServices: [],
        };


        this.state = {
            page: 1,
            arXHR: [],
            isRender: false,
            coordinates: [],
            yandexMapInited: false,
            SEARCH: {},
            HOTELS_INFO: {},
            USER_FAV: [...this.USER_FAV],
            isMapWide: false,
            filter: Object.assign({
                active: false,
                expandedBlock: null,
                priceMin: 10000,
                priceMax: 1000000,
            }, this.filterStartValue),
            arAllRegions: [],
            curDate: this.curDate,
            dates: this.getDatesList(),

            isLoadingLT: !!this.LL_API_IN,
            chkLTResNum: 0,
            arXHRs: [],
        };

    }

    addToFav(hotelId, link){

        const idx = this.state.USER_FAV.indexOf(hotelId)
        let newUserFav =[...this.state.USER_FAV];

        if(-1 !== idx){
            newUserFav = [
                ...newUserFav.slice(0, idx),
                ...newUserFav.slice(idx + 1, newUserFav.length)
            ];
        }else{
            newUserFav.push(hotelId);
        }
        this.setState({USER_FAV: newUserFav});


        $.get("/local/ajax/fav.php?ID=" + hotelId + "&link=" + encodeURIComponent(link), function (res) {});
    }

    getLTHotelList() {

        if (this.LL_API_IN) {

            let xhr = $.ajax({
                url: '/tour-search/ajax.php',
                data: {
                    LL_API_IN: this.LL_API_IN,
                    ajax: 'Y',
                    dataType: 'json',
                    cache: false
                },
                beforeSend: () => {
                    //console.log('getLTHotelList beforeSend');
                },
            }).done((data) => {

                if (!data) {

                    this.setLLAsFinished();
                } else {
                    data = JSON.parse(data);

                    if (data.success) {
                        this.processLTHotelListResult(data);
                    } else {
                        this.setLLAsFinished();
                    }
                }

            });

            this.arXHRsPush(xhr);

        }
    }

    processLTHotelListResult(data) {

        let hasPreparingReq = this.hasPreparingRequests(data.status);
        let hasCompletedReq = this.hasCompletedRequests(data.status);

        if (hasCompletedReq) {
            this.getLTCompletedRequests(data.request_id, !hasPreparingReq);
        }

        if (hasPreparingReq) {
            this.setState({
                chkLTResNum: this.state.chkLTResNum + 1
            });

            if (this.state.chkLTResNum < this.LLMaxChkNum) {
                setTimeout(() => {
                    this.chkLTResultStatus(data.request_id);
                }, this.LLChkTimeOut);
            }
        }

        if (!hasCompletedReq && !hasPreparingReq) {
            this.setLLAsFinished();
        }

    }

    chkLTResultStatus(request_id) {
        if (!this.state.isLoadingLT) return;


        var xhr = $.ajax({
            url: '/local/include/ajax/chk-lt-result.php',
            data: {
                request_id: request_id,
                dataType: 'json',
                cache: false
            },
            beforeSend: () => {
            },
        }).done((data) => {
            data = JSON.parse(data);
            data.request_id = request_id;

            this.processLTHotelListResult(data);
        });

        this.arXHRsPush(xhr);
    }

    hasPreparingRequests(obStatus) {
        for (var i in obStatus) {
            if ('pending' == obStatus[i] || 'performing' == obStatus[i]) return true;
        }
        return false;
    }

    hasCompletedRequests(obStatus) {

        let flag = false;

        for (let key in obStatus) {

            if (
                ('completed' == obStatus[key] || 'cached' == obStatus[key]) && !this.LLCompletedRequests[key]
            ) {
                flag = true;
                this.LLCompletedRequests[key] = true;
            }
        }

        return flag;
    }

    getLTCompletedRequests(request_id, isLastRequest) {

        const _this = this;
        var xhr = $.ajax({
            url: '/tour-search/ajax.php',
            data: {
                request_id: request_id,
                lt_action: 'get_resuls',
                ajax: 'Y',
                origUrl: document.location.href,
                dataType: 'json',
                cache: false,
            },
            beforeSend: () => {
            },
        }).done((data) => {

            if (data) {
                data = JSON.parse(data);

                if (data.SEARCH instanceof Object) {

                    const minServices = 'перелет, проживание';

                    for (let key in data.SEARCH) {
                        let hotelInfo = this.state.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID] || data.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID];
                        if (!hotelInfo) {
                            delete data.SEARCH[key];
                            continue;
                        }

                        data.SEARCH[key].minServices = minServices;
                        data.SEARCH[key].Price = +data.SEARCH[key].Price

                    }


                    let obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                    let hotelsInfo = Object.assign({}, this.state.HOTELS_INFO, data.HOTELS_INFO);

                    this.resultsHandler(obSearch, hotelsInfo);


                }


                /*
                 for (let key in data.SEARCH) {
                 let hotelInfo = this.state.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID] || data.HOTELS_INFO[data.SEARCH[key].HOTEL_INFO_ID];
                 if(!hotelInfo){
                 delete data.SEARCH[key];
                 continue;
                 }


                 data.SEARCH[key].minServices = minServices;
                 data.SEARCH[key].Price = +data.SEARCH[key].Price


                 }
                 */

            }


        });

        this.arXHRsPush(xhr);
    }


    componentDidUpdate() {
        initSliderRange(this);
        initSliderStars(this);
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

    getNtkHotelList() {

        if (this.NTK_API_IN.Destination) {
            this.NTK_PACk_TYPES.forEach((pack) => {
                const NTK_API_IN = {...this.NTK_API_IN, ...pack};

                let xhr = $.ajax({
                    url: this.ajaxUrl,
                    data: {
                        NTK_API_IN,
                        ajax: 'Y',
                        origUrl: document.location.href
                    },
                    dataType: 'json',
                    cache: false,
                    beforeSend: () => {
                        //console.log('before send ajax');
                        //console.log('before send ajax');

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
                            if (!hotelInfo) {
                                delete data.SEARCH[key];
                                continue;
                            }


                            data.SEARCH[key].minServices = minServices;
                            data.SEARCH[key].Price = +data.SEARCH[key].Price;

                            data.SEARCH[key].ntk = true;


                        }

                        let obSearch = {};

                        if (+pack['FlightType'] === 2) { // туры с перелетом перекрывают то что уже получено
                            obSearch = Object.assign({}, data.SEARCH, this.state.SEARCH);
                        } else {
                            obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                        }

                        let hotelsInfo = Object.assign({}, this.state.HOTELS_INFO, data.HOTELS_INFO);

                        this.resultsHandler(obSearch, hotelsInfo);


                    }
                });

                this.arXHRsPush(xhr);

            });
        }


    }

    resultsHandler(obSearch, hotelsInfo, userFav) {

        //console.log('handle results');
        //console.log('obSearch: ', obSearch);
        //console.log('hotelsInfo: ', hotelsInfo);

        // все дубли по отелям с ценой большей минимальной удаляем
        let arUsedKeys = [];
        Object.values(obSearch)
            .sort((i, j) => i.Price - j.Price)
            .forEach((i) => {
                if (-1 !== arUsedKeys.indexOf(i.bxHotelId)) {
                    delete obSearch[i.HOTEL_INFO_ID];
                }
                arUsedKeys.push(i.bxHotelId);
            });

        let priceMin = this.state.filter.priceFrom;
        let priceMax = 0;
        let dates = Object.assign({}, this.state.dates);
        
        for (let key in obSearch) {
            if (obSearch[key].Price < priceMin) priceMin = obSearch[key].Price;
            if (obSearch[key].Price > priceMax) priceMax = obSearch[key].Price;

            if (
                dates[obSearch[key].HotelLoadDate] &&
                (!dates[obSearch[key].HotelLoadDate].Price || dates[obSearch[key].HotelLoadDate].Price > obSearch[key].Price)
            ) {
                dates[obSearch[key].HotelLoadDate].Price = obSearch[key].Price;
            }

        }
        

        if (Object.keys(dates).length) {
            for (let key in dates) {

                let printPrice;

                if (dates[key].Price) {
                    printPrice = (
                        <div className="tour-week__filter__item__price">от
                            <span>{numberFormat(dates[key].Price, 0, '', ' ')} р</span></div>
                    )
                } else {
                    printPrice = <div className="tour-week__filter__item__price">Нет туров</div>;
                }

                dates[key].printPrice = printPrice;
            }
        }


        let arAllRegions = [...this.state.arAllRegions];
        for (let key in hotelsInfo) {
            if (hotelsInfo[key].LOCATION[1]) {
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

            SEARCH: obSearch,
            HOTELS_INFO: hotelsInfo,

        });


        this.filterStartValue.priceFrom = priceMin;
        this.filterStartValue.priceTo = priceMax;

    }


    componentDidMount() {
        this.getNtkHotelList();

        this.getLTHotelList();
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
            
            const isInFav = this.state.USER_FAV.indexOf(hotel.bxHotelId) !== -1;
            
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
                                    {images.map((img, idx) => <div className="carousel__item" key={idx}><img src={img}/>
                                    </div>)}
                                </Slider>
                                : ''}
                        </div>
                        <div className="col__middle hotel-card__content">
                            <div className="rating left -star-4"></div>
                            <span className={"icon-addfavorite right" + (isInFav ? ' active ' : ' ')}
                                    onClick={() => this.addToFav(hotel.bxHotelId, hotelInfo.DETAIL_LINK)}
                            ></span>
                            <span className="icon-newsletter right"
                                  onClick={(e) => sendToEmail(e.target, hotel.bxHotelId, hotelInfo.DETAIL_LINK)}
                            ></span>

                            <h5 className="hotel-card__title" title={hotelInfo.NAME}>{hotelInfo.NAME}</h5>
                            <div
                                className="hotel-card__location">{hotelInfo.LOCATION.join(', ')}</div>

                            {this.renderAttrs(hotelInfo.arPreparedAttrs)}

                            <div className="hotel-card__service">{hotel.minServices}</div>

                            {/*<div className="world-rating"></div>*/}

                            <a href={hotelInfo.DETAIL_LINK} className="button buy">
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


    onClickFilterClear(e) {
        e.preventDefault();

        this.setState({
            filter: Object.assign(this.state.filter, this.filterStartValue),
        });

    }

    getFiltersNum() {
        let num = 0;
        let isPriceConsidered = false;
        for (let key in this.filterStartValue) {

            if (key == 'priceFrom' || key == 'priceTo') {
                if (!isPriceConsidered && (this.filterStartValue[key] != this.state.filter[key])) {
                    num++;
                }
                isPriceConsidered = true;
            } else if (key == 'arRegions' || key == 'arServices') {
                if (this.state.filter[key].length) {
                    num++;
                }
            } else {
                if (this.filterStartValue[key] != this.state.filter[key]) {
                    num++;
                }
            }

        }

        return num;
    }


    renderFilter() {

        if (!Object.keys(this.state.SEARCH).length) return;

        const {filter} = this.state;

        let filterHeaderCls = ' tour-addit__filter__top ';
        if (filter.active) filterHeaderCls += ' active ';

        let filtersNum = this.getFiltersNum();

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
                                            <span className="text">Выбрано фильтров: {filtersNum}</span>
                                            {filtersNum ?
                                                <a className="clear-filters"
                                                   onClick={(e) => this.onClickFilterClear(e)}>Очистить фильтры</a>
                                                : ''}
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

    renderDates() {

        let arDates = Object.values(this.state.dates).sort((i, j) => i.ts - j.ts);

        if (!arDates.length) return;

        //console.log('=======================');
        //console.log('this.state.dates: ', this.state.dates);
        //console.log('arDates: ', arDates);


        return (
            <div className="region-left col__left -col-60">
                <div className="tour-week__filter">
                    {arDates.map((date, idx) => {
                        return (
                            <div className="tour-week__filter__item"
                                 onClick={() => this.onWeekFilterClick(date.dateRaw)}
                                 key={idx}>
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
            onlyNTKOperator,
            starsFrom,
            arServices,
        } = filter;

        let filtersNum = this.getFiltersNum();

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

                    <div
                        className={"block-inline block-inline__collapse" + (expandedBlock == 'sorting' ? ' expanded ' : '')}>

                        <div className="block-inline__collapse__top" onClick={() => this.filterBlockToggle('sorting')}>
                            <h5>Сортировать по: цене</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>

                        <div className="block-collapse__bottom">
                            <div className="block-checkbox" onClick={() => this.setSort('asc')}>
                                <label className="label-checkbox" htmlFor="price-asc">
                                    <input type="radio"
                                           readOnly
                                           checked={sort === 'asc'}/>
                                    <span className="text">Сортировать от меньшей цены к большей</span>
                                </label>
                            </div>
                            <div className="block-checkbox" onClick={() => this.setSort('desc')}>
                                <label className="label-checkbox" htmlFor="price-desc">
                                    <input type="radio"
                                           readOnly
                                           checked={sort === 'desc'}/>
                                    <span className="text">Сортировать от большей цены к меньшей</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div
                        className={"block-inline block-inline__collapse" + (expandedBlock == 'operator' ? ' expanded ' : '')}>
                        <div className="block-inline__collapse__top" onClick={() => this.filterBlockToggle('operator')}>
                            <h5>Туроператор</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="block-checkbox" onClick={() => this.setOperator(false)}>
                                <label className="label-checkbox">
                                    <input type="checkbox" readOnly checked={!onlyNTKOperator}/>
                                    <span className="text">Все туроператоры</span>
                                </label>
                            </div>
                            <div className="block-checkbox grey">
                                <label className="label-checkbox">
                                    <input type="checkbox" readOnly
                                           onChange={() => this.setOperator(true)}
                                           checked={onlyNTKOperator}
                                    />
                                    <span className="text">Только НТК Интурист</span>
                                </label>
                            </div>

                        </div>
                    </div>
                    <div
                        className={"block-inline block-inline__collapse" + (expandedBlock == 'regions' ? ' expanded ' : '')}>
                        <div className="block-inline__collapse__top" onClick={() => this.filterBlockToggle('regions')}>
                            <h5>Регионы</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="block-checkbox" onClick={() => this.setRegion(null)}>
                                <label className="label-checkbox">
                                    <input type="checkbox" readOnly checked={!arRegions.length}/>
                                    <span className="text">Все регионы</span>
                                </label>
                            </div>
                            {this.state.arAllRegions.map((region, idx) => {
                                return (
                                    <div className="block-checkbox" key={idx}>
                                        <label className="label-checkbox">
                                            <input type="checkbox"
                                                   readOnly
                                                   onChange={() => this.setRegion(region)}
                                                   checked={-1 !== arRegions.indexOf(region)}/>
                                            <span className="text">{region}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div
                        className={"block-inline block-inline__collapse" + (expandedBlock == 'stars' ? ' expanded ' : '')}>
                        <div className="block-inline__collapse__top" onClick={() => this.filterBlockToggle('stars')}>
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
                                 data-from={starsFrom}></div>
                        </div>
                    </div>

                    <div className={"block-inline block-inline__collapse" + (expandedBlock == 'service' ? ' expanded ' : '')}>
                        <div className="block-inline__collapse__top" onClick={() => this.filterBlockToggle('service')}>
                            <h5>Удобства</h5>
                            <span className="icon-arrow-down"></span>
                            <span className="icon-arrow-up"></span>
                        </div>
                        <div className="block-collapse__bottom">
                            <div className="block-collapse__bottom-recreation">
                                {this.services.map((i, idx) => {
                                    return (
                                        <div
                                            className={"option" + (arServices.indexOf(i.className) !== -1 ? ' active ' : '')}
                                            key={i.className}
                                            onClick={(e) => {
                                                e.target.classList.toggle('active');
                                                this.setService(i.className);
                                            }}>
                                            <div className="option-text">{i.name}</div>
                                            <span className={i.className}></span>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>
                    </div>

                    {/*
                     <div className="block-inline block-inline__collapse" onClick={(e) => this.filterBlockToggle(e, 'shore')}>
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
                     <div className="block-inline__collapse__top" onClick={(e) => this.filterBlockToggle(e, 'resttype')}>
                     <h5>Тип отдыха</h5>
                     <span className="icon-arrow-down"></span>
                     <span className="icon-arrow-up"></span>
                     </div>
                     <div className="block-collapse__bottom">
                     Контент
                     </div>
                     </div>
                     */}


                </div>
                {filtersNum ?
                    <div className="block-inline block-clear-filters">
                        <a className="clear-filters" onClick={(e) => this.onClickFilterClear(e)}>Очистить фильтры</a>
                    </div>
                    : ''}
            </div>
        );
    }


    render() {

        console.log('====================================');
        console.log('====================================');
        console.log('====================================');

        console.time("Pre render ");

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

        
        console.log('this.state.arXHRs: ', this.state.arXHRs);
        console.log('this.arXHRs: ', this.arXHRs);

        

        //console.time("remove me time");
        //search = search.filter(i => +i.Price > 0);
        //console.timeEnd("remove me time");

        // фильтро по обводке
        if (this.state.coordinates.length) {
            console.time("фильтро по обводке time");
            search = search.filter(i => this.map.markers[i.HOTEL_INFO_ID])
            console.timeEnd("фильтро по обводке time");
        }

        console.time("curDate filter time");
        search = search.filter(i => (i.HotelLoadDate === this.state.curDate));

        // stay here
        let arSearchHotelIdsAfterTimeFilter = [...search].map(i => i.bxHotelId);
        console.timeEnd("curDate filter time");

        console.time("price filter time");
        search = search.filter(i => (i.Price >= filter.priceFrom && i.Price <= filter.priceTo));
        console.timeEnd("price filter time");


        // ФИЛЬТР ПО РЕГИОНАМ
        if (this.state.filter.arRegions.length) {
            search = search.filter(i => {
                const hotelInfo = this.state.HOTELS_INFO[i.HOTEL_INFO_ID];
                return hotelInfo && hotelInfo.LOCATION[1] && -1 !== this.state.filter.arRegions.indexOf(hotelInfo.LOCATION[1]);
            });
        }

        if (this.state.filter.onlyNTKOperator) {
            search = search.filter(i => {
                return i.ntk;
            });
        }


        console.time("stars filter time");
        if (this.state.filter.starsFrom > 0) {
            search = search.filter(i => {
                const hotelInfo = this.state.HOTELS_INFO[i.HOTEL_INFO_ID];
                return hotelInfo && hotelInfo.STARS_INT && hotelInfo.STARS_INT >= this.state.filter.starsFrom;
            });
        }
        console.timeEnd("stars filter time");

        console.time('services filter time');
        if (this.state.filter.arServices.length) {
            search = search.filter(i => {
                const hotelInfo = this.state.HOTELS_INFO[i.HOTEL_INFO_ID];

                if (hotelInfo && hotelInfo.arPreparedAttrs) {
                    const hotelAttrs = Object.keys(hotelInfo.arPreparedAttrs);
                    return this.state.filter.arServices.every((i) => -1 !== hotelAttrs.indexOf(i));
                }

                return false;
            });
        }
        console.timeEnd('services filter time');


        console.time("sort by price");
        search = search.sort((i, j) => {
            if (this.state.filter.sort == 'asc') return i.Price - j.Price;
            if (this.state.filter.sort == 'desc') return j.Price - i.Price;
        });
        console.timeEnd("sort by price");

        // отрисовка точек только после всех фильтров
        if (!this.state.isRender) {

            /*
            console.time('calc searchHotelIds');
            let searchHotelIds = search.map(i => i.bxHotelId);
            console.timeEnd('calc searchHotelIds');

            console.time('calc diff');
            let diff = _.difference(arSearchHotelIdsAfterTimeFilter, searchHotelIds);
            console.timeEnd('calc diff');

            console.time("renderMapPoints time");
            if (diff.length) {
                */
                this.renderMapPoints(search);
                /*
            }
            console.timeEnd("renderMapPoints time");
            */
        }

        console.timeEnd("Pre render ");

        return (
            <div className="inner">
                {this.renderFilter()}
                <div className="row">
                    <div className="col__left -col-60 content-region-left">
                        <h2>Поиск тура: найдено предложений: {search.length} {this.isAllXHRCompleted() ? ' ' : ' [крутилка] '}</h2>
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


    initMap() {

        //console.log('--->initMap()');

        if (!ymaps) return;

        if (this.state.yandexMapInited) return;

        try {

            //console.log('--->initMap() ->> try');

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

        if (!this.isAllXHRCompleted()) return;
        if (!this.state.yandexMapInited) return;

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



        // пройти
        // пройти


        this.map.markers2add = [];

        search.map((item) => {

            if (!(this.state.HOTELS_INFO && this.state.HOTELS_INFO[item.HOTEL_INFO_ID] && this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS)) {
                return;
            }

            let point = this.state.HOTELS_INFO[item.HOTEL_INFO_ID].COORDS;

            point = point.split(',');

            if (this.state.coordinates.length && (this.map.polygon && !this.map.polygon.geometry.contains([point[0], point[1]]))) {
                return;
            }


            /*
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
            */


            this.map.markers2add.push(item.HOTEL_INFO_ID);

/*

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

                */


        });



        let merkersKeys = Object.keys(this.map.markers);

        let diff = _.difference(merkersKeys, this.map.markers2add);


        if(this.map.markers2add.length !== merkersKeys.length  || !this.map.markers2add.every(i => this.map.markers[i])){

            if (this.map.collection) {
                this.map.collection.removeAll();
            } else {
                this.map.collection = new ymaps.GeoObjectCollection();
            }

            this.map.markers = {}; 

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
            //output = output.slice(0, 5);
            return (
                <div className="hotel-option">{output}</div>
            );
        }

    }

    onHotelMouseEnter(hotelId) {

        if (!this.map.markers) return;

        const marker = this.map.markers[hotelId];
        if (!marker) return;
        marker.options.set({iconImageHref: this.mapMarkerHover, zIndex: 9999999999});
        this.map.entity.setCenter(marker.geometry.getCoordinates());
    }

    onHotelMouseLeave(hotelId) {
        if (!this.map.markers) return;

        const marker = this.map.markers[hotelId];
        if (!marker) return;
        marker.options.set({iconImageHref: this.mapMarker, zIndex: 999999999});
    }

    setRegion(region) {

        let arRegions = [];

        if (region) {

            arRegions = [...this.state.filter.arRegions];
            let idx = arRegions.indexOf(region);

            if (-1 === idx) {
                arRegions.push(region);
            } else {
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

    setService(service) {

        let arServices = [];

        if (service) {

            arServices = [...this.state.filter.arServices];
            let idx = arServices.indexOf(service);

            if (-1 === idx) {
                arServices.push(service);
            } else {
                arServices = [
                    ...arServices.slice(0, idx),
                    ...arServices.slice(idx + 1, arServices.length)
                ]
            }
        }

        this.setState({
            filter: Object.assign({}, this.state.filter, {arServices: arServices})
        });

    }

    setOperator(onlyNTKOperator) {
        this.setState({
            filter: Object.assign({}, this.state.filter, {onlyNTKOperator: onlyNTKOperator})
        });
    }

    setSort(sort) {
        if (this.state.filter.sort == sort) return;
        this.setState({
            filter: Object.assign({}, this.state.filter, {sort: sort})
        })
    }

    getDatesList() {
        moment.lang('ru');
        let dateFrom = window.RuInturistStore.initForm.dateFrom;
        if (!dateFrom) return {};

        let momentDate = moment(dateFrom, 'DD.MM.YYYY').add(-4, 'day');

        let dates = {};


        for (let i = 0; i <= 6; i++) {

            let date2add = momentDate.add(1, 'day');
            const dateRaw = date2add.format('DD.MM.YYYY');

            dates[dateRaw] = {
                ts: +date2add.format('X'),
                dateRaw: dateRaw,
                dayOfWeek: date2add.format('dddd'),
                dayAndMonth: date2add.format('D MMMM'),
            };
        }
        return dates;
    }

    filterBlockToggle(blockId) {
        this.setState({
            filter: Object.assign({}, this.state.filter, {expandedBlock: blockId})
        });
    }


    filterToggle() {
        this.setState({
            filter: Object.assign({}, this.state.filter, {active: !this.state.filter.active})
        });
    }

    onWeekFilterClick(curDate) {

        this.setState({curDate});

        if (this.state.coordinates.length) {
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

    arXHRsPush(xhr) {
        this.arXHRs.push(xhr);
        /*
        this.setState({
            arXHR: [...this.arXHRs]
        });
        */
    }

    isAllXHRCompleted(){
        return this.arXHRs.every(i => i.readyState === 4)
    }

    setLLAsFinished() {
        this.setState({chkLTResNum: 777, isLoadingLT: false});
    }
}