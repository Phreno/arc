/**================================================================================================
 *                                         SECTION DEBUG
 *================================================================================================**/

function trace(...args) {
    if (DEBUG_MODE) {
        console.log(args)
    }
}


/**
 * Construit un tableau dont les valeurs sont les index
 *
 * @param {*} count
 * @return {*} 
 */
function range(count) {
    return [...Array(count).keys()];
}


/**========================================================================
 * todo                             TODO
 *  -[ ] mieux controller la longueur des segments
 *  -[ ] corriger la densité
 *  -[ ] gérer la création horaire/anti-horaire des rayons
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

    range(count).reduce((A) => {
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

function computeBeta(angle) {
    return angle * Math.PI / 180.0;
}

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



/**
 * Calcul les coordonnées des points de références
 * en fonction de la hauteur et de la largeur
 *
 * @return {*} 
 */
function getData({width, height}) {
    /**========================================================================
     * todo                             TODO
     *   - [ ] Moduler les données en fonction de le hauteur et de la largeur fournie
     *   
     *   
     *
     *========================================================================**/
    return [
        [TOP_LEFT, BOTTOM_LEFT],
        [BOTTOM_LEFT, BOTTOM_RIGHT],
        [BOTTOM_RIGHT, TOP_RIGHT],
        [TOP_RIGHT, TOP_LEFT]
    ];
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
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
}

/**
 * Construit la frame courante
 *
 * @param {*} {width=WIDTH, height=HEIGHT, svg, angle, count}
 */
function drawFrame({
    width = WIDTH,
    height = HEIGHT,
    svg,
    angle,
    count
}) {
    flushScene(svg);
    getData(width, height).forEach(([O, A]) => {
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
 * Affiche l'ouverture actuelle de l'angle sur l'interface
 *
 * @param {*} angle
 */
function displayAngle(angle) {
    document.getElementById("angle").innerText = `angle: ${angle.toFixed(3)}`;
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
    let svg = document.getElementById(svgID);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    return svg;
}


function checkOrHalt(runConditions) {
    if (runConditions.some(c => !c)) {
        clearInterval(interval);
    }
}

/**================================================================================================
 *                                         SECTION MAIN
 *================================================================================================**/

const WIDTH = 500
const HEIGHT = 500
const STARTING_ANGLE = 1
const IMG_PER_SECOND = 30
const DENSITY = 10
const DELTA = -0.001
const SVG_ID = "tagSVG"
const DEBUG_MODE = true
const ANIMATION_MODE = false
const MAX_FRAME = 100
const TOP_RIGHT = {
    x: WIDTH,
    y: 0
};
const TOP_LEFT = {
    x: 0,
    y: 0
};
const BOTTOM_LEFT = {
    x: 0,
    y: HEIGHT
};
const BOTTOM_RIGHT = {
    x: WIDTH,
    y: HEIGHT
};

let interval;

/**
 * Paramètre et lance l'animation
 *
 * @param {*} {
 *     svgID = "tagSVG",
 *     width = 500,
 *     height = 500,
 *     angle = 10,
 *     imgPerSecond = 30,
 *     density = 180
 * }
 */
function main({
    svgID = SVG_ID,
    width = WIDTH,
    height = HEIGHT,
    angle = STARTING_ANGLE,
    imgPerSecond = IMG_PER_SECOND,
    density = DENSITY,
    delta = DELTA,
    maxFrame = MAX_FRAME
}) {
    let svg = initSVG({
        svgID,
        width,
        height
    });
    /**========================================================================
     * todo                             TODO
     *   - [ ] Corriger la densité
     *   * Le nombre de segment a afficher doit occuper un angle de 90 degrés   
     *   
     *
     *========================================================================**/
    density = density / angle

    if (ANIMATION_MODE) {
        interval = setInterval(renderFrame, 1000 / imgPerSecond)
    } else {
        renderFrame()
    }

    function renderFrame() {
        displayAngle(angle);
        drawFrame({
            svg,
            angle,
            count: density
        });
        checkOrHalt([angle > 0, maxFrame--]);
        angle += delta;
    }
}