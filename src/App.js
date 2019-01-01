import React, {Component} from 'react';
import './App.css';
import grn from './grn.json'
import Map from "pigeon-maps"
import Overlay from "pigeon-overlay"

class MapItem extends Component {
    render() {
        return <div>{this.props.children}</div>
    }
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
            collected: []
        }
    }

    componentDidMount() {
        if ("geolocation" in navigator) {
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
                    console.log("firstPos")
                    this.setState({
                        firstPos: true,
                        locations: grn.data.filter(x => x.eur !== undefined).map(card => {
                            const rnd = mulberry32(card.arena_id)
                            return Object.assign({}, card, {
                                long: x.coords.longitude + rnd() / 100,
                                lat: x.coords.latitude + rnd() / 100
                            })
                        })
                    })
                }
            })
        }
    }

    inReach(arr, x) {
        const dx = arr[0] - x.lat
        const dy = arr[1] - x.long
        return Math.sqrt(dx * dx + dy * dy) < 0.0014
    }

    render() {
        const arr =
            this.state.loc ?
                [this.state.loc.latitude, this.state.loc.longitude] :
                [54.3126, 10.11]
        const firstPos = this.state.firstPos || arr
        // const screen = window.screen
        const w = window.innerWidth - 5
        const h = window.innerHeight - 5

        const zoom = 18

        return (
            <div className="App">
                <Map center={arr} zoom={zoom} width={w} height={h}>
                    {(this.state.locations || []).map(x => {
                            const inColl = this.state.collected.findIndex(y => y.arena_id === x.arena_id) >= 0
                            return <Overlay anchor={[x.lat, x.long]}>
                                {this.inReach(arr, x) ? <div
                                        onClick={() => {
                                            if (this.state.collected.findIndex(y => y.arena_id === x.arena_id) === -1 && this.inReach(arr, x)) {
                                                this.setState({
                                                    collected: this.state.collected.concat([x])
                                                })
                                            }
                                        }}>
                                        {this.getSymbol(x)}
                                        {inColl && "✓"}
                                        <br/>
                                        <img alt="" src={x.image_uris && x.image_uris.art_crop} width={100}/>
                                    </div> :
                                    this.getSymbol(x)}
                            </Overlay>
                        }
                    )}
                    <Overlay anchor={arr}>
                        <div className="ripplecontainer">
                            <a className="circle photo" href="//time2hack.com" target="_blank"></a>
                            <div className="ripplecircle"></div>
                        </div>
                    </Overlay>

                </Map>
                <p style={{position: "absolute", top: 0, right: 0}}>
                    {/*this.state.selected && <div>
                        {this.state.selected.name}
                        <br/>
                        <img src={this.state.selected.image_uris && this.state.selected.image_uris.art_crop}
                             width={100}/>
                        <br/>
                    </div>*/}
                    <div onClick={() => this.setState({info: !this.state.info})}
                         style={{backgroundColor: "rgba(255,255,255,0.8)", padding: 8}}>
                        <span className="ms ms-multiple"/>
                        Info
                        ({this.state.collected.length})
                        {this.state.info &&
                        <div>
                            <hr/>
                            {/*JSON.stringify(Object.assign({}, this.state, {locations: (this.state.locations || []).length}))*/}
                            Collected:
                            <ul>
                                {this.state.collected.map(x =>
                                    <li key={"l" + x.arena_id}>
                                        {this.getSymbol(x)}
                                    </li>
                                )}
                            </ul>
                            <br/>
                            <a style={{color: "black", textDecoration: "none"}}
                               href="https://pigeon-maps.js.org"
                               target="_blank">Powered by pigeon-maps</a>
                        </div>}
                    </div>

                </p>
            </div>
        );
    }

    getSymbol(x) {
        const guilds = {
            uw: "ms-guild-azorius",
            wr: "ms-guild-boros",
            ub: "ms-guild-dimir",
            bg: "ms-guild-golgari",
            rg: "ms-guild-gruul",
            ur: "ms-guild-izzet",
            bw: "ms-guild-orzhov",
            br: "ms-guild-rakdos",
            wg: "ms-guild-selesnya",
            ug: "ms-guild-simic"
        }
        return <span><span className={"ms ms-" + ((x.color_identity || [])[0] + "").toString().toLowerCase()}/> {x.name}</span>
    }
}

export default App;
