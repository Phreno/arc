/**================================================================================================
 *                                         SECTION DEBUG
 *================================================================================================**/

function trace(...args) {
    if (DEBUG_MODE) {
        console.log(args)
    }
}

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




/**================================================================================================
 *                                         SECTION DRAWING
 *================================================================================================**/

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
    color = "black"
}) {
    var l;

    l = document.createElementNS("http://www.w3.org/2000/svg", "line");

    [
        ["x1", O.x + "px"],
        ["y1", O.y + "px"],
        ["x2", A.x + "px"],
        ["y2", A.y + "px"],
        ["stroke", color],
        ["stroke-width", 0.4]
    ].forEach(([att, val]) => l.setAttribute(att, val));


    svg.appendChild(l);
    return (l);
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
            A,
            color: COLOR_MODE ? pickHex({
                weight: i
            }) : REFERENCE_COLOR

        })
        /* Prepare le dessin pour la prochaine itération */
        return computeNextPoint({
            O,
            A,
            beta: computeBeta(angle)
        });
    }, A);
}


function pickHex({
    color1 = '009900',
    color2 = '990000',
    weight
}) {
    var w1 = 1 / (weight + 1);
    var w2 = 1 - 1 / (w1 + 1);
    var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)
    ];

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex([r, g, b]) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    return rgbToHex(rgb);
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
    beta
}) {
    /**========================================================================
     * todo                             TODO
     *   - [ ] Permettre une orientation horaire ou anti-horaire
     *  - [ ] Controller la longueur du segment pour ne pas dépasser du carré
     *   
     *   
     *
     *========================================================================**/
    let x = Math.round(O.x + (A.x - O.x) * Math.cos(beta) + (A.y - O.y) * Math.sin(beta));
    let y = Math.round(O.y - (A.x - O.x) * Math.sin(beta) + (A.y - O.y) * Math.cos(beta));
    return {
        x,
        y
    };
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
    return SECOND / imgPerSecond;
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
    /**========================================================================
     * todo                             TODO
     *   - [ ] Moduler les données en fonction de le hauteur et de la largeur fournie
     *   
     *   
     *
     *========================================================================**/
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
    ANIMATION_MODE = false
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
    ANIMATION_MODE = true;

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
    currentFrame,
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

let WIDTH = 250,
    HEIGHT = 250,
    STARTING_ANGLE = 1,
    IMG_PER_SECOND = 25,
    DELTA = 0.001,
    SVG_ID = "tagSVG",
    DEBUG_MODE = true,
    ANIMATION_MODE = true,
    COLOR_MODE = false,
    REFERENCE_COLOR = 'black',
    MAX_FRAME = 1000,
    REFERENCE_ANGLE = 90,
    SECOND = 1000,
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
    SQUARE = [
        [TOP_LEFT, BOTTOM_LEFT],
        [BOTTOM_LEFT, BOTTOM_RIGHT],
        [BOTTOM_RIGHT, TOP_RIGHT],
        [TOP_RIGHT, TOP_LEFT]
    ],
    DIAGONAL = [
        [TOP_LEFT, BOTTOM_RIGHT],
        [BOTTOM_LEFT, TOP_RIGHT],
        [BOTTOM_RIGHT, TOP_LEFT],
        [TOP_RIGHT, BOTTOM_LEFT]
    ],
    DUAL = [
        [TOP_LEFT, TOP_RIGHT].reverse(),
        [BOTTOM_RIGHT, BOTTOM_LEFT].reverse(),
    ],
    MIX = [
        [TOP_LEFT, BOTTOM_RIGHT],
        [TOP_RIGHT, BOTTOM_LEFT],
        [BOTTOM_LEFT, TOP_LEFT],
        [BOTTOM_RIGHT, TOP_RIGHT],
    ],
    REFERENCE_DATA = SQUARE,
    DEFAULT = {},
    global = {
        interval: undefined,
        svg: undefined
    };

function init() {
    initSVG(DEFAULT);
}