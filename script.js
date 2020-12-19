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
        ["stroke-width", 0.5]
    ].forEach(([att, val]) => l.setAttribute(att, val));


    svg.appendChild(l);
    return (l);
}

function draw({
    svg,
    O,
    A,
    angle = 0.2,
    count = 360
}) {
    var beta, xB, yB;

    beta = angle * Math.PI / 180.0;

    // while (svg.firstChild)
    //     svg.removeChild(svg.firstChild);

    [...Array(count).keys()].forEach(_line => {
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
    width = 1000,
    height = 1000,
    angle = 0.1,
    count
}) {
    let svg = document.getElementById(svgID)
    svg.setAttribute("width", width)
    svg.setAttribute("height", height);
    if (!count) {
        count = 180 / angle
    }

    let interval = setInterval(() => {
        renderScene(width, height, svg, angle, count);
        angle += 0.00001
        if (angle > 1) {
            clearInterval(interval)
        }
    }, 1)
}

function renderScene(width, height, svg, angle, count) {
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
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