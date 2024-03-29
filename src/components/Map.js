import React, { Component } from 'react';
import MapboxGL from 'mapbox-gl';

class Map extends Component {

    constructor(props) {
        super(props);

        this.state = {
            api_url: 'https://data.edmonton.ca/resource/87ck-293k.json',
            map:false,
            viewport: {
                zoom: 10,
                center: [-113.4989,53.5444]
            },
            data: null
        }
    };

    initializeMap() {
        MapboxGL.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
        let map = new MapboxGL.Map({
            container : 'map',
            style: 'mapbox://styles/mapbox/light-v9',
            ...this.state.viewport
        });

        map.on('load', () => {
            map.addLayer({
                "id":"points",
                "type":"circle",
                "source": {
                    "type":"geojson",
                    "data": this.state.data
                },
                "paint": {
                    "circle-radius": 5,
                    "circle-color": "#BDD455"
                }
            })
        });
        
        map.on('click','points',(e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const { details,description,impact,duration } = e.features[0].properties;

            while(Math.abs(e.lngLat.lng = coordinates[0])>180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360: -360;
            }

            new MapboxGL.Popup()
            .setLngLat(coordinates)
            .setHTML(`
               <strong>${description}</strong><br />
               <em>${impact}</em><br />
               <em>${duration}</em><br />
               <p>${details}</p>
            `)
            .addTo(map);
        });

        map.on('mouseenter','points',() => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave','points',() => {
            map.getCanvas().style.cursor = '';
        });

        this.setState({ map });
    }

    createFeatureCollection(data) {
       let features = [];
       data.forEach(point => {
           features.push({
              "type":"Feature",
              "geometry": {
                  "type": "Point",
                  "coordinates": [
                      parseFloat(point.location.longitude),
                      parseFloat(point.location.latitude)
                  ]
              },
              "properties": {
                  "description": point.description,
                  "details": point.details,
                  "duration": point.duration,
                  "impact": point.impact
              }
           });
       });

       return {
           "type":"FeatureCollection",
           "features": features
       }
    }

    componentDidMount() {
        const { data,api_url } = this.state;

        if(!data) {
            fetch(api_url, {method: 'GET' })
            .then(response => response.json())
            .then(response => this.createFeatureCollection(response))
            .then(response => this.setState({ data: response}));
        }
    }

  render() {

    const { map,data } = this.state;

    if(data && !map) this.initializeMap();

    return (
        <div style={{ width: 1100, height: 600 }} id="map" />
    );
  }
}

export default Map;