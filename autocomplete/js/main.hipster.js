'use strict'

$(document).ready(() => {
    class Section {
        constructor(element, child = null) {
            this.element = $(element)
            this.container = this.element.closest('.row')
            this.layer = null
            this.child = child
            this.element.on('click', () => {
                this.element.val('')
                this.child.hide(true)
            })
        }

        hide(hideChild) {
            this.element.val('')
            this.container.addClass('hidden')
            if (hideChild && this.child) {
                this.child.hide(true)
            }
        }

        show() {
            this.container.removeClass('hidden')
        }
    }

    class MapSection extends Section {
        constructor(element) {
            super(element)
            this.child = null
        }

        makeSquare() {
            this.container.height(this.container.width)
            this.layer && this.layer.container.fitToViewport()
        }
    }

    const Map = new MapSection('#map')
    const City = new Section('#city-input', Map)
    const District = new Section('#district-input', City)
    const Region = new Section('#region-input', District)

    let placemark

    const addPlacemark = (map, city) => {
        if (placemark !== undefined) {
            map.geoObjects.remove(placemark)
        }
        map.setCenter(city.geoData)
        placemark = new ymaps.Placemark(city.geoData, {}, {
            preset: 'islands#greenDotIconWithCaption'
        })
        map.geoObjects.add(placemark)
    }

    const getSource = (url, id) => (request, response) => $.get(
        `http://cdu-task.herokuapp.com/${url}?name=${request.term}${(id) ? (`&id=${id}`) : ''}`,
        data => response($.map(data, (item) => ({
            id: item.id,
            label: item.name,
            value: item.name
        }))))

    ymaps.ready(() => Map.layer = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 12
    }, {
        searchControlProvider: 'yandex#search'
    }))

    Region.element.autocomplete({
        source: getSource('getRegionsList'),
        select: (ignored, ui) => {
            $('div[data-id="district-input"]').removeClass('hidden')

            District.element.autocomplete({
                source: getSource('getDistrictsByRegionID', ui.item.id),
                select: (ignored, ui) => {
                    $('div[data-id="city-input"]').removeClass('hidden')

                    City.element.autocomplete({
                        source: getSource('getCitiesByDistrictID', ui.item.id),
                        select: (ignored, ui) => $.get('http://cdu-task.herokuapp.com/getCityByID?id=' + ui.item.id, city => {
                            Map.show()
                            Map.makeSquare()

                            addPlacemark(Map.layer, city)
                        })
                    })
                }
            })
        },
        minLength: 0
    })
})