let
    DEFAULT = {},
    STARTING_ANGLE = 1,
    IMG_PER_SECOND = 10,
    DELTA = 0.002,
    SVG_ID = "tagSVG",
    DEBUG_PRECISION = 3,
    REFERENCE_COLOR = 'black',
    REFERENCE_STROKE_WIDTH = 0.4,
    MAX_FRAME = 1000,
    SQUARE_ANGLE = 90,
    PENTAGRAM_ANGLE = 36,
    TRIANGLE_ANGLE = 60,
    HEXAGON_ANGLE = 120,
    MS_IN_SECOND = 1000,
    PIXEL_PER_CM = 0.0264583333,
    REFERENCE_ANGLE = PENTAGRAM_ANGLE,
    SIZE_CM = 15,
    HEXAGON_WIDTH_CM = computeHexagonWidthFromHeight(SIZE_CM),
    PENTAGON_HEIGHT_CM = computePentagonHeightFromWidth(SIZE_CM),
    WIDTH = convertCentimeterToPixel(HEXAGON_WIDTH_CM),
    HEIGHT = convertCentimeterToPixel(SIZE_CM),
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
    return [...Array(Math.ceil(count)).keys()];
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
    width = WIDTH,
    height = HEIGHT
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
    color = REFERENCE_COLOR
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
    color = REFERENCE_COLOR,
    strokeWidth = REFERENCE_STROKE_WIDTH
}) {
    return [
        ["x1", concatPixelUnit(O.x)],
        ["y1", concatPixelUnit(O.y)],
        ["x2", concatPixelUnit(A.x)],
        ["y2", concatPixelUnit(A.y)],
        ["stroke", color],
        ["stroke-width", REFERENCE_STROKE_WIDTH]
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
    svg.innerHTML = ''
}

/**
 * Construit la frame courante
 *
 * @param {*} {width=WIDTH, height=HEIGHT, svg, angle, count}
 */
function drawFrame({
    svg,
    angle,
    count
}) {
    flushScene(svg);
    getData(DEFAULT).forEach(([O, A]) => {
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
    width = WIDTH,
    height = HEIGHT
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
    global.interval = setInterval(() => {
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
    svg = global.svg
}) {
    let count = computeCount({
        angle
    });
    debug(computeDebugData({
        currentFrame,
        angle,
        count
    }));
    drawFrame({
        svg,
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
    REFERENCE_DATA.forEach(([O, A], i) => {
        debugData[`O${getGreekLetterAtIndex(i)}`] = `(${O.x},${O.y})`;
        debugData[`A${getGreekLetterAtIndex(i)}`] = `(${A.x},${A.y})`;
    });
    return debugData;
}

function getGreekLetterAtIndex(i) {
    return String.fromCharCode(i + 945);
}

function init() {
    initSVG(DEFAULT);
    renderFrame({});
}

/**================================================================================================
 *                                         SECTION DATA
 *================================================================================================**/

let point = {
    square: {
        gamma: function getSquareGamma({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width,
                y: height
            };
        },

        beta: function getSquareBeta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 0,
                y: height
            };
        },

        alpha: function getSquareAlpha({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 0,
                y: 0
            };
        },

        delta: function getSquareDelta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width,
                y: 0
            };
        },
        offset: {
            epsilon: function getSquareEpsilonOffset({
                width = WIDTH,
                height = HEIGHT
            }) {
                return {
                    x: 2 * width,
                    y: height
                };
            },
            gamma: function getSquareGammaOffset({
                width = WIDTH,
                height = HEIGHT
            }) {
                return {
                    x: 0,
                    y: 2 * height
                };
            },
            beta: function getSquareBetaOffset({
                width = WIDTH,
                height = HEIGHT
            }) {
                return {
                    x: width,
                    y: -height
                };
            },
            alpha: function getSquareAlphaOffset({
                width = WIDTH,
                height = HEIGHT
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
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 1.175 * (width / 2) + (width - 1.175 * (width / 2)) / 2,
                y: height
            };
        },
        gamma: function getPentagonGamma({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: (width - 1.175 * (width / 2)) / 2,
                y: height
            };
        },
        epsilon: function getPentagonEpsilon({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width,
                y: height - (1.118 * height / 1.809)
            };
        },

        beta: function getPentagonBeta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 0,
                y: height - (1.118 * height / 1.809)
            };
        },

        alpha: function getPentagonAlpha({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width / 2,
                y: 0
            };
        }
    },
    hexagon: {
        delta: function getHexagonDelta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width / 2,
                y: height
            };
        },

        epsilon: function getHexagonEpsilon({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width,
                y: (3 / 4) * height
            };
        },

        zeta: function getHexagonZeta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: width,
                y: (1 / 4) * height
            };
        },

        gamma: function getHexagonGamma({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 0,
                y: (3 / 4) * height
            };
        },

        beta: function getHexagonBeta({
            width = WIDTH,
            height = HEIGHT
        }) {
            return {
                x: 0,
                y: (1 / 4) * height
            };
        },
        alpha: function getHexagonAlpha({
            width = WIDTH,
            height = HEIGHT
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
        width = WIDTH,
        height = HEIGHT
    }) {
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
        width = WIDTH,
        height = HEIGHT
    }) {
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
        width = WIDTH,
        height = HEIGHT
    }) {
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
        width = WIDTH,
        height = HEIGHT
    }) {
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
        width = WIDTH,
        height = HEIGHT
    }) {
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
        width = WIDTH,
        height = HEIGHT
    }) {
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

/**
 * Calcul les coordonnées des points de références
 * en fonction de la hauteur et de la largeur
 *
 * @return {*} 
 */
function getData({
    reference = REFERENCE_DATA
}) {
    return reference
}