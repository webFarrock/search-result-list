import React, {Component} from 'react';


export default class LoaderMini extends Component {

    render(){
        return(
            <span className="search-loader -tour_search-mini">
                <span className="search-loader-wrapper">
                    <span className="search-loader-wrapper__circle">
                        <svg viewBox="0 0 190 190">
                            <g id="submit">
                                <g id="Ellipse_2">
                                    <path style={{fill:'#0072d3'}} d="M6 95C6 43.5 43.5 5.9 95 5.9V0C42.5 0 0 42.5 0 95s42.5 95 95 95v-5.9c-51.5 0-89-37.6-89-89.1z"/>
                                    <linearGradient id="SVGID_10_" gradientUnits="userSpaceOnUse" x1="142.5" y1="404" x2="142.5" y2="594" gradientTransform="translate(0 -404)">
                                        <stop offset=".2" stopColor="#0072d3" stopOpacity="0"/>
                                        <stop offset="1" stopColor="#0072d3"/>
                                    </linearGradient>
                                    <path style={{fill:'url(#SVGID_10_)'}} className="st11" d="M95 0v5.9c51.5 0 89 37.7 89 89.1 0 51.5-37.6 89.1-89 89.1v5.9c52.5 0 95-42.5 95-95S147.5 0 95 0"/>
                                </g>
                                <animateTransform attributeName="transform" type="rotate" from="0 95 95" to="360 95 95" repeatCount="indefinite" dur="2s"></animateTransform>
                            </g>
                        </svg>
                    </span>
                    <span className="search-loader-wrapper__inner"></span>
                </span>
            </span>
        )
    }
}