import React from 'react';
import ReactDOM from 'react-dom';
import SearchResultList from './components/search-result-list';
console.log('SearchResultList: ', SearchResultList);
ReactDOM.render(
        <SearchResultList />
    , document.querySelector('#react-search-result-list'));
