'use strict';

$(document).ready(function () {
    var map, placemark;

    function addPlacemark(map, city) {
        if (placemark !== undefined) {
            map.geoObjects.remove(placemark);
        }
        map.setCenter(city.geoData);
        placemark = new ymaps.Placemark(city.geoData, {

        }, {
            preset: 'islands#greenDotIconWithCaption'
        });
        map.geoObjects.add(placemark);
    }

    function getSource(url, id) {
        let idParam = (id) ? ('&id=' + id) : '';
        return function (request, response) {
            $.ajax({
                url: 'http://cdu-task.herokuapp.com/' + url + '?name=' + request.term + idParam,
                success: function (data) {
                    response($.map(data, function (item) {
                        return {
                            id: item.id,
                            label: item.name,
                            value: item.name
                        }
                    }));
                }
            });
        }
    }

    ymaps.ready(function () {
        map = new ymaps.Map('map', {
            center: [55.76, 37.64],
            zoom: 12
        }, {
            searchControlProvider: 'yandex#search'
        });
    });

    var mapContainer = $('#map');
    var mapSection = $('div[data-id="map"]');

    var regionInput = $('#region-input');
    var districtInput = $('#district-input');
    var cityInput = $('#city-input');

    var districtInputSection = $('div[data-id="district-input"]');
    var cityInputSection = $('div[data-id="city-input"]');

    regionInput.on('click', function () {
        $(this).val('');
        districtInput.val('');
        cityInput.val('');

        districtInputSection.addClass('hidden');
        cityInputSection.addClass('hidden');
        mapSection.addClass('hidden');
    });

    districtInput.on('click', function () {
        $(this).val('');
        cityInput.val('');

        cityInputSection.addClass('hidden');
        mapSection.addClass('hidden');
    });

    cityInputSection.on('click', function () {
        $(this).val('');

        mapSection.addClass('hidden');
    });

    regionInput.autocomplete({
        source: getSource('getRegionsList'),
        select: function (event, ui) {
            $('div[data-id="district-input"]').removeClass('hidden');

            districtInput.autocomplete({
                source: getSource('getDistrictsByRegionID', ui.item.id),
                select: function (event, ui) {
                    $('div[data-id="city-input"]').removeClass('hidden');

                    cityInput.autocomplete({
                        source: getSource('getCitiesByDistrictID', ui.item.id),
                        select: function (event, ui) {
                            $.get('http://cdu-task.herokuapp.com/getCityByID?id=' + ui.item.id, function (city) {
                                mapSection.removeClass('hidden');
                                mapContainer.height(mapContainer.width());
                                map.container.fitToViewport();

                                addPlacemark(map, city);
                            });
                        }
                    })
                }
            })
        },
        minLength: 0
    })
});