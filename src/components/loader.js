import React, {Component} from 'react';


export default class Loader extends Component {

    render(){
        return(
            <div className="_search-loader _-tour_search">
                <div className="search-loader-wrapper">
                    <div className="search-loader-wrapper__circle">
                        <svg viewBox="0 0 190 190">

                            <g id="submit">
                                <g id="Ellipse_3">
                                    <path style={{fill:'#0072d3'}} d="M1.7 95C1.7 43.5 43.5 1.7 95 1.7V0C42.5 0 0 42.5 0 95s42.5 95 95 95v-1.7c-51.5 0-93.3-41.8-93.3-93.3z" />
                                    <linearGradient id="SVGID_11_" gradientUnits="userSpaceOnUse" x1="142.5" y1="404" x2="142.5" y2="594" gradientTransform="translate(0 -404)">
                                        <stop offset=".2" stopColor="#0072d3" stopOpacity="0"/>
                                        <stop offset="1" stopColor="#0072d3"/>
                                    </linearGradient>
                                    <path style={{fill:'url(#SVGID_11_)'}} d="M95 0v1.7c51.5 0 93.3 41.9 93.3 93.3 0 51.5-41.9 93.3-93.3 93.3v1.7c52.5 0 95-42.5 95-95S147.5 0 95 0z" />
                                </g>
                                <animateTransform attributeName="transform" type="rotate" from="0 95 95" to="360 95 95" repeatCount="indefinite" dur="2s"></animateTransform>
                            </g>

                        </svg>
                    </div>
                    <div className="search-loader-wrapper__inner">Подождите, пожалуйста, осталось совсем чуть-чуть</div>
                </div>
            </div>
        )
    }
}