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
            data[property].toFixed(3) :
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
    var l;

    l = document.createElementNS("http://www.w3.org/2000/svg", "line");

    getLineAttributes({
        O,
        A,
        color
    }).forEach(([att, val]) => l.setAttribute(att, val));


    svg.appendChild(l);
    return (l);
}

function getLineAttributes({
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

/**================================================================================================
 *                                         SECTION DATA
 *================================================================================================**/

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
 *     width = WIDTH,
 *     height = HEIGHT
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

function stopAnimation() {
    clearInterval(global.interval);
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
    })
    debug({
        currentFrame,
        angle,
        segmentsPerCorner: count
    });
    drawFrame({
        svg,
        angle,
        count
    });
}

/**================================================================================================
 *                                         SECTION CONFIGURATION
 *================================================================================================**/

let
    STARTING_ANGLE = 1,
    IMG_PER_SECOND = 20,
    DELTA = 0.002,
    SVG_ID = "tagSVG",
    DEBUG_MODE = true,
    REFERENCE_COLOR = 'black',
    REFERENCE_STROKE_WIDTH = 0.4,
    MAX_FRAME = 400,
    REFERENCE_ANGLE = 90,
    MS_IN_SECOND = 1000,
    PIXEL_PER_CM = 0.0264583333,
    SIZE_CM = 5,
    WIDTH = convertCentimeterToPixel(SIZE_CM),
    HEIGHT = convertCentimeterToPixel(SIZE_CM),
    TOP_RIGHT = {
        x: WIDTH,
        y: 0
    },
    TOP_LEFT = {
        x: 0,
        y: 0
    },
    BOTTOM_LEFT = {
        x: 0,
        y: HEIGHT
    },
    BOTTOM_RIGHT = {
        x: WIDTH,
        y: HEIGHT
    },
    OFFSET = {
        L2R: {
            TOP_LEFT: {
                x: -WIDTH,
                y: 0
            },
            TOP_RIGHT: {
                x: WIDTH,
                y: -HEIGHT
            },
            BOTTOM_LEFT: {
                x: 0,
                y: 2 * HEIGHT
            },
            BOTTOM_RIGHT: {
                x: 2 * WIDTH,
                y: HEIGHT
            },
        }
    },
    SQUARE = [
        [TOP_LEFT, OFFSET.L2R.BOTTOM_LEFT],
        [BOTTOM_LEFT, OFFSET.L2R.BOTTOM_RIGHT],
        [BOTTOM_RIGHT, OFFSET.L2R.TOP_RIGHT],
        [TOP_RIGHT, OFFSET.L2R.TOP_LEFT]
    ],
    /**========================================================================
     * todo          Agrandir les configuration de départ disponible
     *   Proposer différentes forme géométrique
     * - [ ] triangle
     * - [ ] hexagone
     *========================================================================**/
    REFERENCE_DATA = SQUARE,
    DEFAULT = {},
    global = {
        interval: undefined,
        svg: undefined
    };

function init() {
    initSVG(DEFAULT);
}