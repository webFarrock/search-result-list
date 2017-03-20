import React, {Component} from 'react';
import {number_format} from '../tools/tools'

export default class SearchResultList extends Component {

    constructor(props){
        console.log('SearchResultList constructor');
        super(props);

        this.state = {
            page: 1,
            SEARCH_RAW: {},
            SEARCH: {},
            HOTELS_INFO: {},
            isLoading: true,
            isLoadingLT: true,
            chkLTResNum: 0,
            ltUsedOperators: [],
            completedRequests: {},
            boundsFirst: true,
            isBtnOn: false,
        };

        this.NTK_API_IN = window.RuInturistStore.NTK_API_IN;
        this.LL_API_IN = window.RuInturistStore.LL_API_IN;

        this.ajaxUrl = '/tour-search/ajax.php';

        this.arAjaxReq = []; // массив xhr обьектами

        this.LTMaxChkNum = 8; // максимальное количество запросов к ЛЛ
        this.LTChkTimeOut = 4 * 1000; // интервал проверки результатов ЛТ
        this.itemsPerPage = 25; // кол-во элементов на стр

    }

    componentDidMount(){

        this.getNtkHotelList();



        function initMap() {
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

        initMap();



        jQuery(document).ready(function ($) {

            $('.tour-search__map__hide').click(function () {
                if (!$('.tour-search__map').hasClass('small')) {
                    $(this).addClass('expand').children('.label').text('Развернуть');
                    $(this).children('.icon-arrow-right').attr('class', 'icon-arrow-left');
                    $('.tour-search__map').addClass('small');
                    $('.tour-search__results').addClass('wide');
                } else {
                    $(this).removeClass('expand').children('.label').text('Скрыть');
                    $(this).children('.icon-arrow-left').attr('class', 'icon-arrow-right');
                    $('.tour-search__map').removeClass('small');
                    if ($('.tour-search__results').hasClass('wide')) {
                        $('.tour-search__results').removeClass('wide');
                    }
                }
            });  
            
            console.log('');


            // scroll content
            /*
            var pane = $('.scroll-content');
            pane.jScrollPane({
                autoReinitialise: true
            });

            var api = pane.data('jsp');
            $('.scroll-bottom').bind('click', function () {
                // Note, there is also scrollByX and scrollByY methods if you only
                // want to scroll in one dimension
                api.scrollBy(0, 259);
                return false;
            });

*/


        });

    }

    componentDidUpdate(){
        $('.carousel-in').each(function () {
            var $root = $(this);
            var $thumbs = $root.next('.carousel-in-thumbs');

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


    getNtkHotelList() {

        console.log('getNtkHotelList: ');
        console.log('this.NTK_API_IN: ', this.NTK_API_IN);
        
        if (this.NTK_API_IN.Destination){

            var req = $.ajax({
                url: this.ajaxUrl,
                data: {
                    NTK_API_IN: this.NTK_API_IN,
                    ajax: 'Y',
                },
                dataType: 'json',
                //dataType: 'text',
                cache: false,
            }).done(data => {



                if (data && data.SEARCH instanceof Object) {

                    let obSearch = Object.assign({}, this.state.SEARCH, data.SEARCH);
                    this.setState({
                        SEARCH: obSearch,
                        HOTELS_INFO: Object.assign({}, this.state.HOTELS_INFO, data.HOTELS_INFO),
                        USER_FAV: [].concat(data.USER_FAV, this.state.USER_FAV),
                        isLoading: false
                    });

                }

            });

            this.arAjaxReq.push(req);
        }
    }

    renderAttrs(attrs){

        let  output = [];


        if(attrs instanceof Object){
            for (var key in attrs) {
                output.push(
                    <span className={key} title={attrs[key].join(', ')}></span>

                )
            }
        }

        if(output.length){
            output = output.slice(0,5);
            return(
                <div className="hotel-option">{output}</div>
            );
        }

    }

    renderHotels(){

        console.log('!!!!!!!!!!!this.state.SEARCH: ',this.state);

        let search = Object.values(this.state.SEARCH);

        search.filter(i => +i.Price > 0);
        return search.map((hotel) => {
            let hotelInfo = this.state.HOTELS_INFO[hotel.HOTEL_INFO_ID];

            if(hotelInfo){
                const priceForPrint = number_format(+hotel.Price, 0, '', ' ',);

                return(
                    <li className="list__item" key={hotel.HOTEL_INFO_ID}>
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
                                    {hotelInfo.IMAGES.map((i, j) => <div className="carousel__item" key={j}><img src={i} /></div>)}
                                </div>
                            </div>
                            <div className="col__middle hotel-card__content">
                                <div className="rating left -star-4"></div>
                                <span className="icon-addfavorite right"></span>
                                <span className="icon-newsletter right"></span>

                                <h5 className="hotel-card__title" title={hotelInfo.NAME}>{hotelInfo.NAME}</h5>
                                <div className="hotel-card__location">{hotelInfo.LOCATION}</div>

                                    {this.renderAttrs(hotelInfo.arPreparedAttrs)}

                                <div className="hotel-card__service">перелет, трансфер, завтрак</div>

                                <div className="world-rating"></div>

                                <a href="" className="button buy">
                                <span className="buy-wrapper">
                                    <span className="price"><i>от</i> {priceForPrint} <span className="rub">Р</span></span>
                                </span>
                                </a>
                            </div>
                        </div>
                    </li>
                );
            }

        });

    }


    render() {
        return (
            <div>
                <div className="row">
                    <div className="col__left -col-60 content-region-left">
                        <h2>Поиск тура: найдено 14 предложений</h2>
                    </div>
                </div>
                <div className="row">
                    <section className="col__middle section">
                        <div className="section__inner">

                            <div className="row tour-search">
                                <div className="col__right tour-search__map small">
                                    <div className="tour-search__map__wrap">
                                        <div className="tour-search__map__hide expand"><span className="icon-arrow-left"></span><span className="label">Развернуть</span></div>
                                        <div className="tour-search__map__draw"><span>Обвести</span></div>

                                        <div id="map"></div>


                                    </div>

                                    <div className="balloon hoteldetail" data-href="" style={{display: 'none'}}>
                                        <div className="balloon__header">
                                            <a href="#" className="balloon__close close">×</a>
                                            <div className="balloon__header--title">Mantas Sea Side</div>
                                            <div className="rating -star-3"></div>
                                        </div>
                                        <div className="balloon__content">
                                            <div className="balloon-price">Цена от: 77 081 <span className="rub">Р</span></div>
                                            <div className="balloon-destination">Греция / Лутраки</div>

                                            <div className="icon-icon-location-blue"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col__middle tour-search__results wide">
                                    <ul className="list -inline tour-search__results__list scroll-content">


                                        {this.renderHotels()}

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

