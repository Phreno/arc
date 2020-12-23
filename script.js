let
    DEFAULT = {},
    STARTING_ANGLE = 1,
    IMG_PER_SECOND = 10,
    DELTA = 0.002,
    SVG_ID = "tagSVG",
    DEBUG_PRECISION = 3,
    DRAW_COLOR = 'black',
    STROKE_WIDTH = 0.4,
    DATASET = 'pentagram',
    MAX_FRAME = 1000,
    SQUARE_ANGLE = 90,
    PENTAGRAM_ANGLE = 36,
    TRIANGLE_ANGLE = 60,
    HEXAGON_ANGLE = 120,
    MS_IN_SECOND = 1000,
    PIXEL_PER_CM = 0.0264583333,
    REFERENCE_ANGLE = PENTAGRAM_ANGLE,
    SIZE_CM = 15,
    global = {
        interval: undefined,
        svg: undefined
    };




/**================================================================================================
 *                                         SECTION DEBUG
 *================================================================================================**/

/**
 * Affiche l'ouverture actuelle de l'angle sur l'interface
 *
 * @param {*} angle
 */
function debug(data) {

    const html = Object.keys(data).map(prop => `<tr><td>${prop}:</td><td>${display(prop)}</td></tr>`).join('')
    document.getElementById("debug").innerHTML = html

    function display(property) {
        return data[property].toFixed ?
            data[property].toFixed(DEBUG_PRECISION) :
            data[property]

    }
}

/**================================================================================================
 *                                         SECTION TOOLS
 *================================================================================================**/

/**
 * Construit un tableau dont les valeurs sont les index
 *
 * @param {*} count
 * @return {*} 
 */
function range(count) {
    return [...Array(Math.trunc(count)).keys()];
}

function convertPixelToCentimeter(px) {
    return px * PIXEL_PER_CM
}

function convertCentimeterToPixel(cm) {
    return cm / PIXEL_PER_CM
}

function uploadFrame(rawXmlData = global.svg.innerHTML, prefix = "export") {
    uploadFile(prefix, generateSVGFile({
        rawXmlData
    }));
}


function uploadFile(prefix, svgData) {
    const link = document.createElement("a");
    getLinkAttributes({
        prefix,
        svgData
    }).forEach(([attr, val]) => link.setAttribute(attr, val))
    document.body.appendChild(link);
    link.click();
}


function getLinkAttributes({
    prefix,
    svgData,
    target = '_blank'
}) {
    return [
        ["download", getSVGFileName(prefix)],
        ["href", surroundWithMetadata(svgData)],
        ["target", target]
    ];
}

function getSVGFileName(prefix) {
    return `${prefix}.svg`;
}

function surroundWithMetadata(svgData) {
    return `data:image/svg+xml; charset=UTF-8,%EF%BB%BF${encodeURI(svgData)}`;
}

function generateSVGFile({
    rawXmlData,
    width = size.guessFromDataset(),
    height = size.guessFromDataset()
}) {
    return `<?xml version="1.0" standalone="no"?><svg width="${width}px" height="${height}px" version="1.1" xmlns="http://www.w3.org/2000/svg">${rawXmlData}</svg>`;
}

/**================================================================================================
 *                                         SECTION DRAWING
 *================================================================================================**/
/**========================================================================
 * todo                  Construire le dessin sur un canvas
 *   Actuellement c'est un svg qui affiche les motifs d'interférence
 * - [ ] laisser l'export en svg
 * - [ ] transformer l'image SVG en canvas
 *   
 *   
 *
 *========================================================================**/
/**
 * Dessine une ligne
 *
 * @param {*} {
 *     svg,
 *     O,
 *     A,
 *     color = "black"
 * }
 * @return {*} 
 */
function addLine({
    svg,
    O,
    A,
    color = DRAW_COLOR
}) {
    if (svg) {
        let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        getSVGLineAttributes({
            O,
            A,
            color
        }).forEach(([att, val]) => l.setAttribute(att, val));
        svg.appendChild(l);
    }
}

function getSVGLineAttributes({
    O,
    A,
    color = DRAW_COLOR,
    strokeWidth = STROKE_WIDTH
}) {
    return [
        ["x1", concatPixelUnit(O.x)],
        ["y1", concatPixelUnit(O.y)],
        ["x2", concatPixelUnit(A.x)],
        ["y2", concatPixelUnit(A.y)],
        ["stroke", color],
        ["stroke-width", STROKE_WIDTH]
    ];
}

function concatPixelUnit(val) {
    return val + "px";
}

/**
 * Dessine l'ensemble des lignes, 
 * arquées autours d'un point de référence
 *
 * @param {*} {
 *     svg,
 *     O,
 *     A,
 *     angle,
 *     count
 * }
 */
function draw({
    svg,
    O,
    A,
    angle,
    count
}) {

    range(count).reduce((A, _, i) => {
        /* Dessine le segment OA */
        addLine({
            svg,
            O,
            A
        })
        /* Prepare le dessin pour la prochaine itération */
        return computeNextPoint({
            O,
            A,
            beta: computeBeta(angle)
        });
    }, A);
}

/**================================================================================================
 *                                         SECTION MATH
 *================================================================================================**/
/**
 * Calcule le coordonnées du point B, 
 * pour former un arc avec le segment OA
 *
 * @param {*} {
 *     O,
 *     A,
 *     beta
 * }
 * @return {*} 
 */
function computeNextPoint({
    O,
    A,
    beta,
    clockwiseRotation = false
}) {
    if (clockwiseRotation) {
        beta = -beta
    }
    return {
        x: doSomeXMagic({
            O,
            A,
            beta
        }),
        y: doSomeYMagic({
            O,
            A,
            beta
        })
    };
}

function doSomeYMagic({
    O,
    A,
    beta
}) {
    let x = O.y - (A.x - O.x) * Math.sin(beta) + (A.y - O.y) * Math.cos(beta);
    return Math.round(x);
}

function doSomeXMagic({
    O,
    A,
    beta
}) {
    let y = O.x + (A.x - O.x) * Math.cos(beta) + (A.y - O.y) * Math.sin(beta);
    return Math.round(y);
}

function computeBeta(angle) {
    return angle * Math.PI / 180.0;
}


function computeCount({
    angle,
    reference = REFERENCE_ANGLE
}) {
    return reference / angle
}

function computeFrameRate(imgPerSecond) {
    return MS_IN_SECOND / imgPerSecond;
}

function computeHexagonWidthFromHeight(height = SIZE_CM) {
    return Math.sqrt(3) * height / 2;
}

function computePentagonHeightFromWidth(width = SIZE_CM) {
    let c = width / 1.618,
        R = c / 1.175,
        a = 0.809 * R
    return a + R
}

/**================================================================================================
 *                                         SECTION ANIMATION
 *================================================================================================**/

/**
 * Supprime le contenu du svg
 * pour laisser la place à la frame suivante
 *
 * @param {*} svg
 */
function flushScene(svg) {
    if (svg) {
        svg.innerHTML = ''
    }
}

/**
 * Construit la frame courante
 *
 * @param {*} {width=WIDTH, height=HEIGHT, svg, angle, count}
 */
function drawFrame({
    svg = global.svg,
    angle,
    count
}) {
    flushScene(svg);
    new Data().getInstance().getData().forEach(([O, A]) => {
        draw({
            svg,
            O,
            A,
            angle,
            count
        });
    });
}

/**
 * Focus sur le dom et initialise la taille du SVG
 *
 * @param {*} {
 *     svgID = SVG_ID,
 *     width = WIDTH,()
 * }
 * @return {*} 
 */
function initSVG({
    svgID = SVG_ID,
    width,
    height
}) {
    global.svg = document.getElementById(svgID);
    global.svg.setAttribute("width", width);
    global.svg.setAttribute("height", height);
}

function stopAnimation(interval = global.interval) {
    clearInterval(interval);
}

function checkOrStopAnimation(runConditions) {
    if (runConditions.some(c => !c)) {
        stopAnimation()
    }
}


function play({
    imgPerSecond = IMG_PER_SECOND,
    angle = STARTING_ANGLE,
    delta = DELTA,
    currentFrame = 1
}) {
    global.interval = setInterval(function playAnimation() {
        renderFrame({
            angle,
            currentFrame
        })
        angle -= delta
        currentFrame++
        checkOrStopAnimation([
            currentFrame < MAX_FRAME
        ])
    }, computeFrameRate(imgPerSecond));
}

function renderFrame({
    angle = STARTING_ANGLE,
    currentFrame = 0,
}) {
    let count = computeCount({
        angle
    });
    if(!global.svg){
        initSVG(size.guessFromDataset());
    }
    debug(computeDebugData({
        currentFrame,
        angle,
        count
    }));
    drawFrame({
        angle,
        count
    });
}

function computeDebugData({
    currentFrame,
    angle,
    count
}) {
    let debugData = {
        currentFrame,
        angle,
        segmentsPerCorner: count,
        computedAngle: angle * count,
    };
    new Data().getInstance().getData().forEach(([O, A], i) => {
        debugData[`O${getGreekLetterAtIndex(i)}`] = `(${O.x},${O.y})`;
        debugData[`A${getGreekLetterAtIndex(i)}`] = `(${A.x},${A.y})`;
    });
    return debugData;
}

function getGreekLetterAtIndex(i) {
    return String.fromCharCode(i + 945);
}

function init(dataset = DATASET) {

}

/**================================================================================================
 *                                         SECTION DATA
 *================================================================================================**/

let point = {
    square: {
        gamma: function getSquareGamma({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width,
                y: height
            };
        },

        beta: function getSquareBeta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 0,
                y: height
            };
        },

        alpha: function getSquareAlpha({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 0,
                y: 0
            };
        },

        delta: function getSquareDelta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width,
                y: 0
            };
        },
        offset: {
            epsilon: function getSquareEpsilonOffset({
                width = size.guessFromDataset(),
                height = size.guessFromDataset()
            }) {
                return {
                    x: 2 * width,
                    y: height
                };
            },
            gamma: function getSquareGammaOffset({
                width = size.guessFromDataset(),
                height = size.guessFromDataset()
            }) {
                return {
                    x: 0,
                    y: 2 * height
                };
            },
            beta: function getSquareBetaOffset({
                width = size.guessFromDataset(),
                height = size.guessFromDataset()
            }) {
                return {
                    x: width,
                    y: -height
                };
            },
            alpha: function getSquareAlphaOffset({
                width = size.guessFromDataset(),
                height = size.guessFromDataset()
            }) {
                return {
                    x: -width,
                    y: 0
                };
            }
        }
    },
    pentagon: {
        delta: function getPentagonDelta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 1.175 * (width / 2) + (width - 1.175 * (width / 2)) / 2,
                y: height
            };
        },
        gamma: function getPentagonGamma({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: (width - 1.175 * (width / 2)) / 2,
                y: height
            };
        },
        epsilon: function getPentagonEpsilon({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width,
                y: height - (1.118 * height / 1.809)
            };
        },

        beta: function getPentagonBeta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 0,
                y: height - (1.118 * height / 1.809)
            };
        },

        alpha: function getPentagonAlpha({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width / 2,
                y: 0
            };
        }
    },
    hexagon: {
        delta: function getHexagonDelta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width / 2,
                y: height
            };
        },

        epsilon: function getHexagonEpsilon({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width,
                y: (3 / 4) * height
            };
        },

        zeta: function getHexagonZeta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width,
                y: (1 / 4) * height
            };
        },

        gamma: function getHexagonGamma({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 0,
                y: (3 / 4) * height
            };
        },

        beta: function getHexagonBeta({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: 0,
                y: (1 / 4) * height
            };
        },
        alpha: function getHexagonAlpha({
            width = size.guessFromDataset(),
            height = size.guessFromDataset()
        }) {
            return {
                x: width / 2,
                y: 0
            };
        }
    }
}

let paths = {
    line: function getLinePaths({
        width,
        height
    } = size.guessFromDataset()) {
        return [
            [point.square.alpha({
                width,
                height
            }), point.square.gamma({
                width,
                height
            })],
            [point.square.gamma({
                width,
                height
            }), point.square.alpha({
                width,
                height
            })],
        ];
    },

    hexagon: function getHexagonPaths({
        width,
        height
    } = size.guessFromDataset()) {
        /**========================================================================
         * todo                             Gestion des chemins de l'hexagone
         *   Terminer le chemin sur le point adjacent n'est pas satisfaisant.
         * - [ ]  prolonger le segment de façon à ce que les arc de cercle couvrent l'hexagone
         *========================================================================**/
        return [
            [point.hexagon.alpha({
                width,
                height
            }), point.hexagon.beta({
                width,
                height
            })],
            [point.hexagon.beta({
                width,
                height
            }), point.hexagon.gamma({
                width,
                height
            })],
            [point.hexagon.gamma({
                width,
                height
            }), point.hexagon.delta({
                width,
                height
            })],
            [point.hexagon.delta({
                width,
                height
            }), point.hexagon.epsilon({
                width,
                height
            })],
            [point.hexagon.epsilon({
                width,
                height
            }), point.hexagon.zeta({
                width,
                height
            })],
            [point.hexagon.zeta({
                width,
                height
            }), point.hexagon.alpha({
                width,
                height
            })],
        ];
    },

    pentagram: function getPentagramPaths({
        width,
        height
    } = size.guessFromDataset()) {
        return [
            [point.pentagon.alpha({
                width,
                height
            }), point.pentagon.gamma({
                width,
                height
            })],
            [point.pentagon.gamma({
                width,
                height
            }), point.pentagon.epsilon({
                width,
                height
            })],
            [point.pentagon.epsilon({
                width,
                height
            }), point.pentagon.beta({
                width,
                height
            })],
            [point.pentagon.beta({
                width,
                height
            }), point.pentagon.delta({
                width,
                height
            })],
            [point.pentagon.delta({
                width,
                height
            }), point.pentagon.alpha({
                width,
                height
            })],
        ];
    },

    star: function getStarPaths({
        width,
        height
    } = size.guessFromDataset()) {
        return [
            [point.hexagon.alpha({
                width,
                height
            }), point.hexagon.gamma({
                width,
                height
            })],
            [point.hexagon.gamma({
                width,
                height
            }), point.hexagon.epsilon({
                width,
                height
            })],
            [point.hexagon.epsilon({
                width,
                height
            }), point.hexagon.alpha({
                width,
                height
            })],
            [point.hexagon.beta({
                width,
                height
            }), point.hexagon.delta({
                width,
                height
            })],
            [point.hexagon.delta({
                width,
                height
            }), point.hexagon.zeta({
                width,
                height
            })],
            [point.hexagon.zeta({
                width,
                height
            }), point.hexagon.alpha({
                width,
                height
            })]
        ];
    },

    triangle: function getTrianglePaths({
        width,
        height
    } = size.guessFromDataset()) {
        return [
            [point.hexagon.alpha({
                width,
                height
            }), point.hexagon.gamma({
                width,
                height
            })],
            [point.hexagon.gamma({
                width,
                height
            }), point.hexagon.epsilon({
                width,
                height
            })],
            [point.hexagon.epsilon({
                width,
                height
            }), point.hexagon.alpha({
                width,
                height
            })]
        ];
    },

    square: function getSquarePaths({
        width,
        height
    } = size.guessFromDataset()) {
        return [
            [point.square.alpha({
                width,
                height
            }), point.square.offset.beta({
                width,
                height
            })],
            [point.square.beta({
                width,
                height
            }), point.square.offset.gamma({
                width,
                height
            })],
            [point.square.gamma({
                width,
                height
            }), point.square.offset.delta({
                width,
                height
            })],
            [point.square.delta({
                width,
                height
            }), point.square.offset.epsilon({
                width,
                height
            })],
        ];
    }

}

let size = {
    guessFromDataset: function (dataset = DATASET, sizeCM = SIZE_CM) {
        let metaSet,
            hexagon = ['hexagon', 'star', 'triangle'],
            pentagon = ['pentagon', 'pentagram'],
            square = ['square', 'line'];

        if (hexagon.includes(dataset)) {
            metaSet = hexagon.shift()
        } else if (pentagon.includes(dataset)) {
            metaSet = pentagon.shift()
        } else if (square.includes(dataset)) {
            metaSet = square.shift()
        }
        return size[metaSet](sizeCM)
    },
    square: function getSquareSize(size = SIZE_CM) {
        return {
            widthInCentimeter: size,
            heightInCentimeter: size,
            width: convertCentimeterToPixel(size),
            height: convertCentimeterToPixel(size)
        }
    },
    hexagon: function getHexagonSize(size = SIZE_CM) {
        let widthInCentimeter = computeHexagonWidthFromHeight(size)
        return {
            widthInCentimeter,
            heightInCentimeter: size,
            width: convertCentimeterToPixel(widthInCentimeter),
            height: convertCentimeterToPixel(size)
        }
    },
    pentagon: function getPentagonSize(size = SIZE_CM) {
        let heightInCentimeter = computePentagonHeightFromWidth(size)
        return {
            widthInCentimeter: size,
            heightInCentimeter,
            width: convertCentimeterToPixel(size),
            height: convertCentimeterToPixel(heightInCentimeter)

        }
    }
}

/**================================================================================================
 *                                         SECTION DATA MANAGER
 *================================================================================================**/
let Data = (function () {
    let instance, _data = {};

    function Singleton() {
        if (instance) {
            return instance;
        }
        instance = this;
        instance.getData = function getDataFromDataset(dataset = DATASET)  {
            if (!_data[dataset]) {
                _data[dataset] = paths[dataset]()
            }
            return [..._data[dataset]]
        }

    }
    Singleton.getInstance = function (dataset = DATASET) {
        let self = instance || new Singleton()
        return self
    }
    return Singleton;
})