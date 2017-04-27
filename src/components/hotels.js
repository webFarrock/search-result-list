import React, {Component} from 'react';
import Slider from 'react-slick';
import {Scrollbars} from 'react-custom-scrollbars';
import {numberFormat} from '../tools/tools';

export default (props) => {
    let {search,
        HOTELS_INFO,
        USER_FAV} = props;

    let sliderSetting = {
        accessibility: false,
        dots: false,
        arrows: true,
        fade: true,
        className: 'carousel carousel-in',
    };

    let hotels = search.map((hotel, idx) => {

        let hotelInfo = HOTELS_INFO[hotel.HOTEL_INFO_ID];
        const priceForPrint = numberFormat(+hotel.Price, 0, '', ' ',);
        let images = hotelInfo.IMAGES || [];

        const isInFav = USER_FAV.indexOf(hotel.bxHotelId) !== -1;

        return (
            <li className="list__item"
                key={idx}
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

                        ></span>
                        <span className="icon-newsletter right"

                        ></span>

                        <h5 className="hotel-card__title" title={hotelInfo.NAME}>{hotelInfo.NAME}</h5>
                        <div
                            className="hotel-card__location">{hotelInfo.LOCATION.join(', ')}</div>


                        <div className="hotel-card__service">{hotel.minServices}</div>

                        <a href={hotelInfo.DETAIL_LINK} className="button buy">
                                <span className="buy-wrapper">
                                    <span className="price"><i>от</i> {priceForPrint} <span className="rub">₽</span></span>
                                </span>
                        </a>
                    </div>
                </div>
            </li>
        );
    });

    return (
        <ul className="list -inline tour-search__results__list scroll-content">
            <Scrollbars

                autoHeight
                autoHeightMin={600}
            >
                {hotels}
            </Scrollbars>
        </ul>
    )

}