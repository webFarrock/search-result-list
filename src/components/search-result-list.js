import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

class SearchResultList extends Component {

    constructor(props){
        console.log('SearchResultList constructor');
        super(props);

    }

    componentDidMount(){
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
            // scroll content
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


                                        {/* карточка */}
                                        <li className="list__item">
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
                                                        <div className="carousel__item"><img src="/local/tpl/dist/static/i/slideshow/hotel-seach-1.jpg" alt="" /></div>
                                                        <div className="carousel__item"><img src="/local/tpl/dist/static/i/slideshow/hotel-seach-2.jpg" alt="" /></div>
                                                        <div className="carousel__item"><img src="/local/tpl/dist/static/i/slideshow/hotel-seach-3.jpg" alt="" /></div>
                                                    </div>
                                                </div>
                                                <div className="col__middle hotel-card__content">
                                                    <div className="rating left -star-4"></div>
                                                    <span className="icon-addfavorite right"></span>
                                                    <span className="icon-newsletter right"></span>

                                                    <h5 className="hotel-card__title">Max Royal Belek</h5>
                                                    <div className="hotel-card__location">Турция, Кемер</div>
                                                    <div className="hotel-option">
                                                        <span className="icon-hotel-datailed-option-1 icon-pool"></span>
                                                        <span className="icon-hotel-datailed-option-4 icon-wifi"></span>
                                                        <span className="icon-hotel-datailed-option-5 icon-gym"></span>
                                                        <span className="icon-hotel-datailed-option-9 icon-sea"></span>
                                                        <span className="icon-hotel-datailed-option-10 icon-air-conditioning"></span>
                                                    </div>
                                                    <div className="hotel-card__service">перелет, трансфер, завтрак</div>

                                                    <div className="world-rating"></div>

                                                    <a href="" className="button buy">
                                                    <span className="buy-wrapper">
                                                        <span className="price"><i>от</i> 999 000 <span className="rub">Р</span></span>
                                                    </span>
                                                    </a>
                                                </div>
                                            </div>
                                        </li>
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



function mapDispatchToProps(dispatch) {
    return bindActionCreators({

    }, dispatch);
}

function mapStateToProps(state) {
    return {...state}
}


export default connect(mapStateToProps, mapDispatchToProps)(SearchResultList);