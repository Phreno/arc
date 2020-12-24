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
    PENTAGON_ANGLE = 108,
    TRIANGLE_ANGLE = 60,
    HEXAGON_ANGLE = 120,
    MS_IN_SECOND = 1000,
    PIXEL_PER_CM = 0.0264583333,
    SIZE_CM = 12,
    shared = {
        interval: undefined,
        svg: undefined,
        dataset: 'square'
    };
/**================================================================================================
 *                                         SECTION DEBUG
 *================================================================================================**/
class Debug {
    static display(data) {
        const html = Object.keys(data).map(prop => `<tr><td>${prop}:</td><td>${display(prop)}</td></tr>`).join('')
        document.getElementById("debug").innerHTML = html
        function display(property) {
            return data[property].toFixed ?
                data[property].toFixed(DEBUG_PRECISION) :
                data[property]
        }
    }
    static compute({
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
            debugData[`O${Tools.getGreekLetterAtIndex(i)}`] = `(${O.x},${O.y})`;
            debugData[`A${Tools.getGreekLetterAtIndex(i)}`] = `(${A.x},${A.y})`;
        });
        return debugData;
    }
}
/**================================================================================================
 *                                         SECTION TOOLS
 *================================================================================================**/
class Tools {
    static range(count) {
        return [...Array(Math.floor(count)).keys()];
    }
    static convertPixelToCentimeter(px) {
        return px * PIXEL_PER_CM
    }
    static convertCentimeterToPixel(cm) {
        return cm / PIXEL_PER_CM
    }
    static getGreekLetterAtIndex(i) {
        return String.fromCharCode(i + 945);
    }
    static concatPixelUnit(val) {
        return val + "px";
    }
}
/**================================================================================================
 *                                         SECTION UPLOAD
 *================================================================================================**/
class UploadManager {
    static uploadFrame(rawXmlData = shared.svg.innerHTML, prefix = "export") {
        UploadManager.uploadFile(prefix, SVGManager.generateSVGFile({
            rawXmlData
        }));
    }
    static uploadFile(prefix, svgData) {
        const link = document.createElement("a");
        UploadManager.getLinkAttributes({
            prefix,
            svgData
        }).forEach(([attr, val]) => link.setAttribute(attr, val))
        document.body.appendChild(link);
        link.click();
    }
    static getLinkAttributes({
        prefix,
        svgData,
        target = '_blank'
    }) {
        return [
            ["download", UploadManager.getSVGFileName(prefix)],
            ["href", UploadManager.surroundWithSVGMetadata(svgData)],
            ["target", target]
        ];
    }
    static getSVGFileName(prefix) {
        return `${prefix}.svg`;
    }
    static surroundWithSVGMetadata(svgData) {
        return `data:image/svg+xml; charset=UTF-8,%EF%BB%BF${encodeURI(svgData)}`;
    }
}
/**================================================================================================
 *                                         SECTION MATH
 *================================================================================================**/
class Mathematic {
    static computeNextPoint({
        O,
        A,
        beta,
        clockwiseRotation = false
    }) {
        if (clockwiseRotation) {
            beta = -beta
        }
        return {
            x: Mathematic.doSomeXMagic({
                O,
                A,
                beta
            }),
            y: Mathematic.doSomeYMagic({
                O,
                A,
                beta
            })
        };
    }
    static doSomeYMagic({
        O,
        A,
        beta
    }) {
        let x = O.y - (A.x - O.x) * Math.sin(beta) + (A.y - O.y) * Math.cos(beta);
        return Math.round(x);
    }
    static doSomeXMagic({
        O,
        A,
        beta
    }) {
        let y = O.x + (A.x - O.x) * Math.cos(beta) + (A.y - O.y) * Math.sin(beta);
        return Math.round(y);
    }
    static computeBeta(angle) {
        return angle * Math.PI / 180.0;
    }
    static computeCount({
        angle,
        referenceAngle
    }) {
        return referenceAngle / angle
    }
    static computeHexagonWidthFromHeight(height = SIZE_CM) {
        return Math.sqrt(3) * height / 2;
    }
    static computePentagonHeightFromWidth(width = SIZE_CM) {
        let c = width / 1.618,
            R = c / 1.175,
            a = 0.809 * R
        return a + R
    }
}
/**================================================================================================
 *                                         SECTION ANIMATION
 *================================================================================================**/
class AnimationManager {
    static flushScene(svg) {
        if (svg) {
            svg.innerHTML = ''
        }
    }
    static computeFrameRate(imgPerSecond) {
        return MS_IN_SECOND / imgPerSecond;
    }
    static drawFrame({
        svg = shared.svg,
        angle,
        count
    }) {
        AnimationManager.flushScene(svg);
        Geometry.getPathsList().forEach(([O, A]) => {
            SVGManager.drawAngle({
                svg,
                O,
                A,
                angle,
                count
            });
        });
    }
    static stop(interval = shared.interval) {
        clearInterval(interval);
    }
    static checkOrStopAnimation(runConditions) {
        if (runConditions.some(c => !c)) {
            AnimationManager.stop()
        }
    }
    static play({
        imgPerSecond = IMG_PER_SECOND,
        angle = STARTING_ANGLE,
        delta = DELTA,
        currentFrame = 1,
        dataset = shared.dataset
    }) {
        shared.interval = setInterval(function playAnimation() {
            AnimationManager.renderFrame({
                angle,
                currentFrame,
                dataset
            })
            angle -= delta
            currentFrame++
            AnimationManager.checkOrStopAnimation([
                currentFrame < MAX_FRAME
            ])
        }, AnimationManager.computeFrameRate(imgPerSecond));
    }
    static renderFrame({
        angle = STARTING_ANGLE,
        currentFrame = 0,
        dataset = shared.dataset
    }) {
        let count = Mathematic.computeCount({
            angle,
            referenceAngle: shape.getReferenceAngle(dataset)
        });
        if (!shared.svg) {
            SVGManager.initContainer(shape.getWidthAndHeight(dataset));
        }
        Debug.display(Debug.compute({
            currentFrame,
            angle,
            count
        }));
        AnimationManager.drawFrame({
            angle,
            count
        });
    }
}
/**================================================================================================
 *                                         SECTION SVG
 *================================================================================================**/
class SVGManager {
    static generateSVGFile({
        rawXmlData,
        width = shape.getWidthAndHeight(),
        height = shape.getWidthAndHeight()
    }) {
        return `<?xml version="1.0" standalone="no"?><svg width="${width}px" height="${height}px" version="1.1" xmlns="http://www.w3.org/2000/svg">${rawXmlData}</svg>`;
    }
    static initContainer({
        svgID = SVG_ID,
        width,
        height
    }) {
        shared.svg = document.getElementById(svgID);
        shared.svg.setAttribute("width", width);
        shared.svg.setAttribute("height", height);
    }
    static computeLineAttributes({
        O,
        A,
        color = DRAW_COLOR,
        strokeWidth = STROKE_WIDTH
    }) {
        return [
            ["x1", Tools.concatPixelUnit(O.x)],
            ["y1", Tools.concatPixelUnit(O.y)],
            ["x2", Tools.concatPixelUnit(A.x)],
            ["y2", Tools.concatPixelUnit(A.y)],
            ["stroke", color],
            ["stroke-width", STROKE_WIDTH]
        ];
    }
    static addLine({
        svg,
        O,
        A,
        color = DRAW_COLOR
    }) {
        if (svg) {
            let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
            SVGManager.computeLineAttributes({
                O,
                A,
                color
            }).forEach(([att, val]) => l.setAttribute(att, val));
            svg.appendChild(l);
        }
    }
    static drawAngle({
        svg,
        O,
        A,
        angle,
        count
    }) {
        Tools.range(count).reduce((A, _, i) => {
            /* Dessine le segment OA */
            SVGManager.addLine({
                svg,
                O,
                A
            })
            /* Prepare le dessin pour la prochaine itération */
            return Mathematic.computeNextPoint({
                O,
                A,
                beta: Mathematic.computeBeta(angle)
            });
        }, A);
    }
}
/**=======================================================================================================================
 *                                                    SECTION GEOMETRY
 *=======================================================================================================================**/
/**======================
 *    SQUARE
 *========================**/
class Square {
    static angle = SQUARE_ANGLE
    static sides(size = SIZE_CM) {
        return {
            widthInCentimeter: size,
            heightInCentimeter: size,
            width: Tools.convertCentimeterToPixel(size),
            height: Tools.convertCentimeterToPixel(size)
        }
    }
    static paths = {
        z: function getLinePaths({
            width,
            height
        } = shape.getWidthAndHeight()) {
            return [
                [Square.point.alpha({
                    width,
                    height
                }), Square.point.gamma({
                    width,
                    height
                })],
                [Square.point.gamma({
                    width,
                    height
                }), Square.point.alpha({
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
                [Square.point.alpha({
                    width,
                    height
                }), Square.offset.beta({
                    width,
                    height
                })],
                [Square.point.gamma({
                    width,
                    height
                }), Square.offset.delta({
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
                [Square.point.alpha({
                    width,
                    height
                }), Square.offset.beta({
                    width,
                    height
                })],
                [Square.point.beta({
                    width,
                    height
                }), Square.offset.gamma({
                    width,
                    height
                })],
                [Square.point.gamma({
                    width,
                    height
                }), Square.offset.delta({
                    width,
                    height
                })],
                [Square.point.delta({
                    width,
                    height
                }), Square.offset.alpha({
                    width,
                    height
                })],
            ];
        }
    }
    static point = {
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
    static offset = {
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
}
/**======================
 *    PENTAGON
 *========================**/
class Pentagon {
    static angle = PENTAGON_ANGLE
    static point = {
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
    static paths = {
        pentagram: function getPentagramPaths({
            width,
            height
        } = shape.getWidthAndHeight()) {
            return [
                [Pentagon.point.alpha({
                    width,
                    height
                }), Pentagon.point.gamma({
                    width,
                    height
                })],
                [Pentagon.point.gamma({
                    width,
                    height
                }), Pentagon.point.epsilon({
                    width,
                    height
                })],
                [Pentagon.point.epsilon({
                    width,
                    height
                }), Pentagon.point.beta({
                    width,
                    height
                })],
                [Pentagon.point.beta({
                    width,
                    height
                }), Pentagon.point.delta({
                    width,
                    height
                })],
                [Pentagon.point.delta({
                    width,
                    height
                }), Pentagon.point.alpha({
                    width,
                    height
                })],
            ];
        },
    }
    static sides(size = SIZE_CM) {
        let heightInCentimeter = Mathematic.computePentagonHeightFromWidth(size)
        return {
            widthInCentimeter: size,
            heightInCentimeter,
            width: Tools.convertCentimeterToPixel(size),
            height: Tools.convertCentimeterToPixel(heightInCentimeter)
        }
    }
}
/**======================
 *    HEXAGON
 *========================**/
class Hexagon {
    static angle = 120
    static point = {
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
    static paths = {
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
                [Hexagon.point.alpha({
                    width,
                    height
                }), Hexagon.point.beta({
                    width,
                    height
                })],
                [Hexagon.point.beta({
                    width,
                    height
                }), Hexagon.point.gamma({
                    width,
                    height
                })],
                [Hexagon.point.gamma({
                    width,
                    height
                }), Hexagon.point.delta({
                    width,
                    height
                })],
                [Hexagon.point.delta({
                    width,
                    height
                }), Hexagon.point.epsilon({
                    width,
                    height
                })],
                [Hexagon.point.epsilon({
                    width,
                    height
                }), Hexagon.point.zeta({
                    width,
                    height
                })],
                [Hexagon.point.zeta({
                    width,
                    height
                }), Hexagon.point.alpha({
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
                [Hexagon.point.alpha({
                    width,
                    height
                }), Hexagon.point.gamma({
                    width,
                    height
                })],
                [Hexagon.point.gamma({
                    width,
                    height
                }), Hexagon.point.epsilon({
                    width,
                    height
                })],
                [Hexagon.point.epsilon({
                    width,
                    height
                }), Hexagon.point.alpha({
                    width,
                    height
                })],
                [Hexagon.point.beta({
                    width,
                    height
                }), Hexagon.point.delta({
                    width,
                    height
                })],
                [Hexagon.point.delta({
                    width,
                    height
                }), Hexagon.point.zeta({
                    width,
                    height
                })],
                [Hexagon.point.zeta({
                    width,
                    height
                }), Hexagon.point.alpha({
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
                [Hexagon.point.alpha({
                    width,
                    height
                }), Hexagon.point.gamma({
                    width,
                    height
                })],
                [Hexagon.point.gamma({
                    width,
                    height
                }), Hexagon.point.epsilon({
                    width,
                    height
                })],
                [Hexagon.point.epsilon({
                    width,
                    height
                }), Hexagon.point.alpha({
                    width,
                    height
                })]
            ];
        }
    }
    static sides(size = SIZE_CM) {
        let widthInCentimeter = Mathematic.computeHexagonWidthFromHeight(size)
        return {
            widthInCentimeter,
            heightInCentimeter: size,
            width: Tools.convertCentimeterToPixel(widthInCentimeter),
            height: Tools.convertCentimeterToPixel(size)
        }
    }
}
let shape = {
    metaShapes: [Hexagon, Pentagon, Square],
    getWidthAndHeight: function (dataset = shared.dataset, sizeCM = SIZE_CM) {
        let match = shape.getGeometry(dataset);
        return match.sides(sizeCM)
    },
    getGeometry: function (dataset = shared.dataset) {
        const isAdmissible = a => Object.keys(a.paths).includes(dataset)
        const match = shape.metaShapes.find(isAdmissible);
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
 *                                                    PAGE
 *=======================================================================================================================**/
class Page {
    static load(dataset = shared.dataset) {
        shared.dataset = dataset
        AnimationManager.renderFrame(DEFAULT)
    }
    static init() {
        Page.renderMenu();
        Page.load(shared.dataset)
    }
    static renderMenu() {
        document.getElementById('menu').innerHTML = shape.metaShapes
            .reduce((acc, cur) => [...acc, ...Object.keys(cur.paths)], [])
            .map(shape => `<li class="nav-item"><a class="nav-link" href="#" onclick="Page.load('${shape}')">${shape}</a></li>`)
            .join('');
    }
}