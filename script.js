/**========================================================================
 * todo                             TODO
 *   -[ ] mieux controller la longueur des segments
 *   -[ ] corriger la densité
 *========================================================================**/


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

function draw({
    svg,
    O,
    A,
    angle,
    count
}) {
    var beta, xB, yB;

    beta = angle * Math.PI / 180.0;

    [...Array(count).keys()].forEach( ()=> {
        xB = Math.round(O.x + (A.x - O.x) * Math.cos(beta) + (A.y - O.y) * Math.sin(beta));
        yB = Math.round(O.y - (A.x - O.x) * Math.sin(beta) + (A.y - O.y) * Math.cos(beta));
        addLine({
            svg,
            O,
            A
        })
        A.x = xB
        A.y = yB
    })

    addLine({
        svg,
        O,
        A
    })

}



function run({
    svgID = "tagSVG",
    width = 500,
    height = 500,
    angle = 10,
    imgPerSecond = 30, 
    density=180
}) {
    let svg = document.getElementById(svgID)
    svg.setAttribute("width", width)
    svg.setAttribute("height", height);
 
    density = density / angle
    

    let interval = setInterval(renderFrame(), 1000/imgPerSecond)

    function renderFrame() {
        return () => {
            document.getElementById("angle").innerText = angle
            renderScene(width, height, svg, angle, density);
            angle -= 0.001;
            if (angle < 0) {
                clearInterval(interval);
            }
        };
    }
}

function renderScene(width, height, svg, angle, count) {
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

function flushScene(svg) {
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
}

function getData(width, height) {
    return [
        [{
                x: 0,
                y: 0
            },
            {
                x: -width,
                y: height * 2
            }
        ],

        [{
                x: 0,
                y: height
            },
            {
                x: width * 2,
                y: height * 2
            }
        ],

        [{
                x: width,
                y: height
            },
            {
                x: width * 2,
                y: -height
            }
        ],
        [{
                x: width,
                y: 0
            },
            {
                x: -width,
                y: -height
            }
        ]
    ];
}
