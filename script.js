let
    DEFAULT = {},
    STARTING_ANGLE = 1,
    IMG_PER_SECOND = 10,
    DELTA = 0.002,
    SVG_ID = "tagSVG",
    DEBUG_PRECISION = 3,
    DRAW_COLOR = 'black',
    STROKE_WIDTH = 0.4,
    MAX_FRAME = 1000,
    SQUARE_ANGLE = 90,
    PENTAGRAM_ANGLE = 36,
    TRIANGLE_ANGLE = 60,
    HEXAGON_ANGLE = 120,
    MS_IN_SECOND = 1000,
    PIXEL_PER_CM = 0.0264583333
SIZE_CM = 12,
    shared = {
        interval: undefined,
        svg: undefined,
        dataset: undefined
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
    Geometry.getPathsList().forEach(([O, A], i) => {
        debugData[`O${getGreekLetterAtIndex(i)}`] = `(${O.x},${O.y})`;
        debugData[`A${getGreekLetterAtIndex(i)}`] = `(${A.x},${A.y})`;
    });
    return debugData;
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
    return [...Array(Math.floor(count)).keys()];
}

function convertPixelToCentimeter(px) {
    return px * PIXEL_PER_CM
}

function convertCentimeterToPixel(cm) {
    return cm / PIXEL_PER_CM
}

function getGreekLetterAtIndex(i) {
    return String.fromCharCode(i + 945);
}


function concatPixelUnit(val) {
    return val + "px";
}
/**================================================================================================
 *                                         SECTION UPLOAD
 *================================================================================================**/
function uploadFrame(rawXmlData = shared.svg.innerHTML, prefix = "export") {
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
        ["href", surroundWithSVGMetadata(svgData)],
        ["target", target]
    ];
}

function getSVGFileName(prefix) {
    return `${prefix}.svg`;
}

function surroundWithSVGMetadata(svgData) {
    return `data:image/svg+xml; charset=UTF-8,%EF%BB%BF${encodeURI(svgData)}`;
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
    referenceAngle
}) {
    return referenceAngle / angle
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
    svg = shared.svg,
    angle,
    count
}) {
    flushScene(svg);
    Geometry.getPathsList().forEach(([O, A]) => {
        draw({
            svg,
            O,
            A,
            angle,
            count
        });
    });
}


function stopAnimation(interval = shared.interval) {
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
    currentFrame = 1,
    dataset = shared.dataset
}) {
    shared.interval = setInterval(function playAnimation() {
        renderFrame({
            angle,
            currentFrame,
            dataset
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
    dataset = shared.dataset
}) {
    let count = computeCount({
        angle,
        referenceAngle: shape.getReferenceAngle(dataset)
    });
    if (!shared.svg) {
        initSVG(shape.getWidthAndHeight(dataset));
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



/**================================================================================================
 *                                         SECTION SVG
 *================================================================================================**/

function generateSVGFile({
    rawXmlData,
    width = shape.getWidthAndHeight(),
    height = shape.getWidthAndHeight()
}) {
    return `<?xml version="1.0" standalone="no"?><svg width="${width}px" height="${height}px" version="1.1" xmlns="http://www.w3.org/2000/svg">${rawXmlData}</svg>`;
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
    shared.svg = document.getElementById(svgID);
    shared.svg.setAttribute("width", width);
    shared.svg.setAttribute("height", height);
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
/**=======================================================================================================================
 *                                                    SECTION GEOMETRY
 *=======================================================================================================================**/

/**======================
 *    SQUARE
 *========================**/
let square = {
    angle: 90
}
square.sides = function getSquareSize(size = SIZE_CM) {
    return {
        widthInCentimeter: size,
        heightInCentimeter: size,
        width: convertCentimeterToPixel(size),
        height: convertCentimeterToPixel(size)
    }
}

square.paths = {
    z: function getLinePaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [square.point.alpha({
                width,
                height
            }), square.point.gamma({
                width,
                height
            })],
            [square.point.gamma({
                width,
                height
            }), square.point.alpha({
                width,
                height
            })],
        ];
    },
    line: function getLinePaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [square.point.alpha({
                width,
                height
            }), square.point.offset.beta({
                width,
                height
            })],
            [square.point.gamma({
                width,
                height
            }), square.point.offset.delta({
                width,
                height
            })],
        ];
    },
    square: function getSquarePaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [square.point.alpha({
                width,
                height
            }), square.point.offset.beta({
                width,
                height
            })],
            [square.point.beta({
                width,
                height
            }), square.point.offset.gamma({
                width,
                height
            })],
            [square.point.gamma({
                width,
                height
            }), square.point.offset.delta({
                width,
                height
            })],
            [square.point.delta({
                width,
                height
            }), square.point.offset.alpha({
                width,
                height
            })],
        ];
    }
}
square.point = {
    gamma: function getSquareGamma({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: width,
            y: height
        };
    },
    beta: function getSquareBeta({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: 0,
            y: height
        };
    },
    alpha: function getSquareAlpha({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: 0,
            y: 0
        };
    },
    delta: function getSquareDelta({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: width,
            y: 0
        };
    }
}

square.point.offset = {
    delta: function getSquareDeltaOffset({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: width,
            y: -height
        };
    },
    gamma: function getSquareGammaOffset({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: 2 * width,
            y: height
        };
    },
    beta: function getSquareBetaOffset({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: 0,
            y: 2 * height
        };
    },
    alpha: function getSquareAlphaOffset({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: -width,
            y: 0
        };
    }
}


/**======================
 *    PENTAGON
 *========================**/
let pentagon = {
    angle: 108
}
pentagon.point = {
    delta: function getPentagonDelta({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: 1.175 * (width / 2) + (width - 1.175 * (width / 2)) / 2,
            y: height
        };
    },
    gamma: function getPentagonGamma({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: (width - 1.175 * (width / 2)) / 2,
            y: height
        };
    },
    epsilon: function getPentagonEpsilon({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: width,
            y: height - (1.118 * height / 1.809)
        };
    },

    beta: function getPentagonBeta({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: 0,
            y: height - (1.118 * height / 1.809)
        };
    },

    alpha: function getPentagonAlpha({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: width / 2,
            y: 0
        };
    }
}
pentagon.paths = {
    pentagram: function getPentagramPaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [pentagon.point.alpha({
                width,
                height
            }), pentagon.point.gamma({
                width,
                height
            })],
            [pentagon.point.gamma({
                width,
                height
            }), pentagon.point.epsilon({
                width,
                height
            })],
            [pentagon.point.epsilon({
                width,
                height
            }), pentagon.point.beta({
                width,
                height
            })],
            [pentagon.point.beta({
                width,
                height
            }), pentagon.point.delta({
                width,
                height
            })],
            [pentagon.point.delta({
                width,
                height
            }), pentagon.point.alpha({
                width,
                height
            })],
        ];
    },
}
pentagon.sides = function getPentagonSize(size = SIZE_CM) {
    let heightInCentimeter = computePentagonHeightFromWidth(size)
    return {
        widthInCentimeter: size,
        heightInCentimeter,
        width: convertCentimeterToPixel(size),
        height: convertCentimeterToPixel(heightInCentimeter)

    }
}

/**======================
 *    HEXAGON
 *========================**/

let hexagon = {
    angle: 120
}
hexagon.point = {
    delta: function getHexagonDelta({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return {
            x: width / 2,
            y: height
        };
    },

    epsilon: function getHexagonEpsilon({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: width,
            y: (3 / 4) * height
        };
    },

    zeta: function getHexagonZeta({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: width,
            y: (1 / 4) * height
        };
    },

    gamma: function getHexagonGamma({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: 0,
            y: (3 / 4) * height
        };
    },

    beta: function getHexagonBeta({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: 0,
            y: (1 / 4) * height
        };
    },
    alpha: function getHexagonAlpha({
        width,
        height
    } = size.guessSidesFromDataset()) {
        return {
            x: width / 2,
            y: 0
        };
    }
}
hexagon.paths = {
    hexagon: function getHexagonPaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        /**========================================================================
         * todo                             Gestion des chemins de l'hexagone
         *   Terminer le chemin sur le point adjacent n'est pas satisfaisant.
         * - [ ]  prolonger le segment de façon à ce que les arc de cercle couvrent l'hexagone
         *========================================================================**/
        return [
            [hexagon.point.alpha({
                width,
                height
            }), hexagon.point.beta({
                width,
                height
            })],
            [hexagon.point.beta({
                width,
                height
            }), hexagon.point.gamma({
                width,
                height
            })],
            [hexagon.point.gamma({
                width,
                height
            }), hexagon.point.delta({
                width,
                height
            })],
            [hexagon.point.delta({
                width,
                height
            }), hexagon.point.epsilon({
                width,
                height
            })],
            [hexagon.point.epsilon({
                width,
                height
            }), hexagon.point.zeta({
                width,
                height
            })],
            [hexagon.point.zeta({
                width,
                height
            }), hexagon.point.alpha({
                width,
                height
            })],
        ];
    },
    star: function getStarPaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [hexagon.point.alpha({
                width,
                height
            }), hexagon.point.gamma({
                width,
                height
            })],
            [hexagon.point.gamma({
                width,
                height
            }), hexagon.point.epsilon({
                width,
                height
            })],
            [hexagon.point.epsilon({
                width,
                height
            }), hexagon.point.alpha({
                width,
                height
            })],
            [hexagon.point.beta({
                width,
                height
            }), hexagon.point.delta({
                width,
                height
            })],
            [hexagon.point.delta({
                width,
                height
            }), hexagon.point.zeta({
                width,
                height
            })],
            [hexagon.point.zeta({
                width,
                height
            }), hexagon.point.alpha({
                width,
                height
            })]
        ];
    },
    triangle: function getTrianglePaths({
        width,
        height
    } = shape.getWidthAndHeight()) {
        return [
            [hexagon.point.alpha({
                width,
                height
            }), hexagon.point.gamma({
                width,
                height
            })],
            [hexagon.point.gamma({
                width,
                height
            }), hexagon.point.epsilon({
                width,
                height
            })],
            [hexagon.point.epsilon({
                width,
                height
            }), hexagon.point.alpha({
                width,
                height
            })]
        ];
    }
}
hexagon.sides = function getHexagonSize(size = SIZE_CM) {
    let widthInCentimeter = computeHexagonWidthFromHeight(size)
    return {
        widthInCentimeter,
        heightInCentimeter: size,
        width: convertCentimeterToPixel(widthInCentimeter),
        height: convertCentimeterToPixel(size)
    }
}


let shape = {
    getWidthAndHeight: function (dataset = shared.dataset, sizeCM = SIZE_CM) {
        let match = shape.getGeometry(dataset);
        return match.sides(sizeCM)
    },

    getGeometry: function (dataset = shared.dataset) {
        const isAdmissible = a => Object.keys(a.paths).includes(dataset)
        const match = [hexagon, pentagon, square]
            .find(isAdmissible);
        if (!match) {
            throw Error(`Unknown dataset (${dataset})`)
        }
        return match;
    },
    getReferenceAngle: function (dataset = shared.dataset) {
        let match = shape.getGeometry(dataset)
        return match.angle;
    }

}


/**================================================================================================
 *                                         SECTION GEOMETRY
 *================================================================================================**/
let Geometry = (function DataModule() {
    let _data = {};
    return {
        getPathsList: function (dataset = shared.dataset) {
            if (!_data[dataset]) {
                _data[dataset] = shape.getGeometry(dataset).paths[dataset]()
            }
            return [..._data[dataset]]
        }
    };
})()

/**=======================================================================================================================
 *                                                    MAIN
 *=======================================================================================================================**/

function init(dataset) {
    shared.dataset = dataset
    renderFrame(DEFAULT)
}