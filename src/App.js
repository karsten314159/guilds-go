import React, {Component} from 'react';
import './App.css';
import Map from "pigeon-maps"
import Overlay from "pigeon-overlay"
import config from "./config"

let {weathermapapi, tomtomapi} = config

function getJSON(url, callback) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'json'
    xhr.onload = function () {
        // console.log("status", xhr.status)
        if (xhr.status < 300) {
            callback(xhr.response)
        } else {
            console.log("error", xhr.status, "body", xhr.response)
        }
    }
    xhr.send()
}


function HR() {
    return <div style={{borderBottom: "1px solid black"}}/>
}

function MapItem(props) {
    let {x, self, inColl, arr} = props
    return <Overlay key={props.key} anchor={[x.lat, x.long]}>
        {self.inReach(arr, x) ? <div
                style={{display: "flex", justifyContent: "space-between"}}
                onClick={() => {
                    if (self.state.collected.findIndex(y => y.arena_id === x.arena_id) === -1 && self.inReach(arr, x)) {
                        console.log("claim " + x.arena_id)
                        self.setState({
                            collected: self.state.collected.concat([x])
                        })
                    }
                }}>
                {self.getSymbol(x, arr, inColl, true)}
                {inColl && <img alt="" src={x.image_uris && x.image_uris.art_crop} width={100} height={100 * (457 / 624)}/>}
            </div> :
            self.getSymbol(x, arr, inColl, true)}
    </Overlay>
}

function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            zoom: 17,
            collected: [],
            time: 0, // new Date().getTime(),
            strategy: function (x, y, z) {
                // "http://c.tile.stamen.com/toner/" + z + "/" + x + "/" + y + ".png"
                // "https://c.basemaps.cartocdn.com/rastertiles/voyager/" + z + "/" + x + "/" + y + ".png"
                return "http://b.tile.stamen.com/watercolor/" + z + "/" + x + "/" + y + ".jpg"
            }
        }
    }

    tick() {
        let now = new Date().getTime()
        let last = this.state.time
        if (now - last > 30000) {
            console.log("4 sec passed")
            let self = this
            this.setState({time: now})

            let {latitude, longitude} = this.state.loc || {}
            if (!latitude) {
                console.log("no current pos")
            } else {
                let url = "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&appid=" + weathermapapi

                getJSON(url, data => {
                    console.log("we", data)
                    let we = data.weather ? (data.weather[0] || {}) : {}

                    self.setState({weather: we.main, weatherIcon: we.icon})
                })

                let keyArr = ["service", "post", "park", "restaurant", "shop", "local"]
                for (let key2 in keyArr) {
                    let url2 = "https://api.tomtom.com/search/2/poiSearch/" + keyArr[key2] + ".json?key=" + tomtomapi + "&lat=" + latitude + "&lon=" + longitude + "&radius=115000"
                    getJSON(url2, data => {
                            console.log("it", data)
                            let it = ((data || {}).results || []).map(x => {
                                return {
                                    name: (x.poi || {}).name,
                                    long: x.position.lon,
                                    lat: x.position.lat
                                }
                            })
                            self.setState({
                                items:
                                    (self.state.items || []).filter(x =>
                                        it.findIndex(y => x.lat === y.lat && x.long === x.long) === -1
                                    ).concat(it)
                            })
                        }
                    )
                    // console.log(url2)
                }
            }
        }
    }

    componentDidMount() {
        let self = this

        window.scrollTo(0, 1)

        function updateSize() {
            self.setState({
                w: window.innerWidth - 3,
                h: window.innerHeight - 4
            })
        }

        updateSize()
        window.addEventListener("resize", updateSize)
        window.addEventListener("orientationchange", updateSize)

        if ("geolocation" in navigator) {
            // window.location
            // let history = window.history
            // history.replaceState(" ", "Guilds Go", "http://tinyurl.com/guildsgo")
            //document.documentElement.webkitRequestFullscreen()

            setInterval(() => this.tick(), 1000)
            this.registerWatchLocation()
        }
    }

    registerWatchLocation() {
        navigator.geolocation.watchPosition(x => {
            this.setState({
                loc: {
                    latitude: x.coords.latitude,
                    longitude: x.coords.longitude,
                    heading: x.coords.heading,
                    speed: x.coords.speed
                }
            })
            if (!this.state.firstPos) {
                console.log("firstPos", x.coords)
                this.setState({
                    firstPos: true /*,
                        locations: grn.data.filter(x => x.eur !== undefined).map(card => {
                            let rnd = mulberry32(card.arena_id)
                            return Object.assign({}, card, {
                                long: x.coords.longitude + rnd() / 50 - 0.004,
                                lat: x.coords.latitude + rnd() / 50 - 0.004
                            })
                        })*/
                })
            }
        })
    }

    inReach(arr, x) {
        return this.dist(arr, x) < 0.0014
    }

    dist(arr, x) {
        let dx = arr[0] - x.lat
        let dy = arr[1] - x.long
        return Math.sqrt(dx * dx + dy * dy)
    }

    render() {
        let arr =
            this.state.loc ?
                [this.state.loc.latitude, this.state.loc.longitude] :
                [54.3126, 10.11]
        let firstPos = this.state.firstPos || arr
        // let screen = window.screen
        let {w, h} = this.state

        let zoom = this.state.zoom
        // limitBounds="true" twoFingerDrag="true" touchEvents="false"  metaWheelZoom="false"
        return (
            <div className="App">
                <Map center={arr} zoom={zoom} width={w} height={h}>
                    {/*provider={(x, y, z) => {
                            // console.log(x + "/" + y + "/" + z)
                            return this.state.strategy(x, y, z)
                        }}*/}
                    <Overlay anchor={arr}>
                        <div className="ripplecontainer">
                            <span className="circle photo"></span>
                            <div className="ripplecircle"></div>
                        </div>
                    </Overlay>

                    {(this.state.locations || []).map((x, i) => {
                        let inColl = this.state.collected.findIndex(y => y.arena_id === x.arena_id) >= 0
                        return MapItem({key: "ca" + i, inColl: inColl, x: x, self: this, arr: arr})
                    })}

                    {(this.state.items || []).map((x, i) => {
                        return MapItem({key: "it" + i, inColl: false, x: x, self: this, arr: arr})
                    })}
                </Map>
                <div style={{position: "absolute", top: 0, right: 0}}>
                    {/*this.state.selected && <div>
                        {this.state.selected.name}
                        <br/>
                        <img src={this.state.selected.image_uris && this.state.selected.image_uris.art_crop}
                             width={100}/>
                        <br/>
                    </div>*/}
                    <div onClick={() => !this.state.info && this.setState({info: !this.state.info})}
                         style={{backgroundColor: "rgba(255,255,255,0.8)", padding: 8}}>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                            <span className="ms ms-multiple" style={{margin: 10}}/>

                            {/*<span> </span>Info<span> </span>({(this.state.items || []).length})*/}
                            {(this.state.weather || "").toLowerCase()}

                            {this.state.weatherIcon &&
                            <img src={"http://openweathermap.org/img/w/" + this.state.weatherIcon + ".png"} alt=""
                                 width="50" height="50" style={{margin: 10}}/>}
                        </div>

                        {this.state.info &&
                        <div>
                            {HR()}
                            <small>
                                <a href="#" onClick={() => this.registerWatchLocation()}>
                                    register location
                                </a>
                                <br/>
                                {/*JSON.stringify(Object.assign({}, this.state, {locations: (this.state.locations || []).length}))*/}
                                {/*Collected:
                                <ul>
                                    {(this.state.items || []).map(x =>
                                        <li key={"l" + x.arena_id}>
                                            {this.getSymbol(x, arr, true, true)}
                                        </li>
                                    )}
                                </ul>*/}
                                <br/>
                                screen: {this.state.w}x{this.state.h}<br/>

                                <span>uses: </span>
                                <ul>
                                    <li><a href="https://pigeon-maps.js.org" target="_blank" rel=" noopener noreferrer">pigeon
                                        maps</a></li>
                                    <li><a href="http://maps.stamen.com" target="_blank"
                                           rel="noopener noreferrer">stamen-watercolor</a></li>

                                    <li><a href="https://developer.tomtom.com/" target="_blank"
                                           rel="noopener noreferrer">tomtom
                                        poi api</a></li>
                                    <li><a href="https://openweathermap.org/" target="_blank"
                                           rel="noopener noreferrer">openwathermaps</a></li>
                                </ul>
                            </small>
                            {HR()}
                            <a href="#" onClick={() => this.state.info && this.setState({info: !this.state.info})}>
                                close
                            </a>
                        </div>}
                    </div>
                </div>
            </div>
        );
    }

    getSymbol(x, arr, inColl, reach) {
        let guilds = {
            uw: "guild-azorius",
            rw: "guild-boros",
            bu: "guild-dimir",
            bg: "guild-golgari",
            gr: "guild-gruul",
            ru: "guild-izzet",
            bw: "guild-orzhov",
            br: "guild-rakdos",
            gw: "guild-selesnya",
            gu: "guild-simic"
        }
        let suf = ((x.color_identity || [])[0] + "").toString().toLowerCase()
        if ((x.color_identity || []).length === 2) {
            let joined = x.color_identity.sort().join("").toLowerCase()
            //console.log(x.color_identity, joined, guilds[joined])
            suf = guilds[joined]
        }
        return <span style={{color: inColl ? "#10A010" : reach ? "#000000" : "#303030"}}>
            <span style={{fontSize: "160%"}} className={"ms ms-" + suf}/> {reach && x.name}
            {inColl ? " ✓" : <i> {(100000 * this.dist(arr, x)).toFixed(3)}m</i>}
        </span>
    }
}

export default App;
