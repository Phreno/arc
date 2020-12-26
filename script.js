let
  DEFAULT = {},
  shared = {
    interval: undefined,
    svg: undefined,
    currentShapeName: 'square'
  };

/**================================================================================================
 *                                         SECTION DEBUG
 *================================================================================================**/
class Debug {
  static precision = 3
  static display(data) {
    const html = Object.keys(data).map(prop => `<tr><td>${prop}:</td><td>${display(prop)}</td></tr>`).join('')
    document.getElementById("debug").innerHTML = html

    function display(property) {
      return data[property].toFixed ?
        data[property].toFixed(Debug.precision) :
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
  static msInSecond = 1000
  static pixelPerCm = 0.0264583333
  static range(count) {
    return [...Array(Math.floor(count)).keys()];
  }
  static convertPixelToCentimeter(px) {
    return px * Tools.pixelPerCm
  }
  static convertCentimeterToPixel(cm) {
    return cm / Tools.pixelPerCm
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
  static computeHexagonWidthFromHeight(height = Player.sizeCm) {
    return Math.sqrt(3) * height / 2;
  }
  static computePentagonHeightFromWidth(width = Player.sizeCm) {
    let c = width / 1.618,
      R = c / 1.175,
      a = 0.809 * R
    return a + R
  }
}
/**================================================================================================
 *                                         SECTION ANIMATION
 *================================================================================================**/
class Player {
  static startingAngle = 1
  static imgPerSecond = 10
  static delta = 0.002
  static maxFrame = 1000
  static sizeCm = 12
  static flushScene(svg) {
    if (svg) {
      svg.innerHTML = ''
    }
  }
  static computeFrameRate(imgPerSecond) {
    return Tools.msInSecond / imgPerSecond;
  }
  static drawFrame({
    svg = shared.svg,
    angle,
    count
  }) {
    Player.flushScene(svg);
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
      Player.stop()
    }
  }
  static play({
    imgPerSecond = Player.imgPerSecond,
    angle = Player.startingAngle,
    delta = Player.delta,
    currentFrame = 1,
    currentShapeName = Page.currentShapeName
  }) {
    Page.load(currentShapeName)
    shared.interval = setInterval(function playAnimation() {
      Player.renderFrame({
        angle,
        currentFrame,
        currentShapeName
      })
      angle -= delta
      currentFrame++
      Player.checkOrStopAnimation([
        currentFrame < Player.maxFrame
      ])
    }, Player.computeFrameRate(imgPerSecond));
  }
  static renderFrame({
    angle = Player.startingAngle,
    currentFrame = 0,
    currentShapeName = Page.currentShapeName
  }) {
    let count = Mathematic.computeCount({
      angle,
      referenceAngle: ShapeManager.getReferenceAngle(currentShapeName)
    });
    Debug.display(Debug.compute({
      currentFrame,
      angle,
      count
    }));
    Player.drawFrame({
      angle,
      count
    });
  }
}
/**================================================================================================
 *                                         SECTION SVG
 *================================================================================================**/
class SVGManager {
  static containerID = 'tagSVG'
  static drawColor = 'black'
  static strokeWidth = 0.4
  static generateSVGFile({
    rawXmlData,
    width = ShapeManager.getWidthAndHeight(),
    height = ShapeManager.getWidthAndHeight()
  }) {
    return `<?xml version="1.0" standalone="no"?><svg width="${width}px" height="${height}px" version="1.1" xmlns="http://www.w3.org/2000/svg">${rawXmlData}</svg>`;
  }
  static initContainer({
    svgID = SVGManager.containerID,
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
    color = SVGManager.drawColor,
    strokeWidth = SVGManager.strokeWidth
  }) {
    return [
      ["x1", Tools.concatPixelUnit(O.x)],
      ["y1", Tools.concatPixelUnit(O.y)],
      ["x2", Tools.concatPixelUnit(A.x)],
      ["y2", Tools.concatPixelUnit(A.y)],
      ["stroke", color],
      ["stroke-width", strokeWidth]
    ];
  }
  static addLine({
    svg,
    O,
    A,
    color = SVGManager.drawColor
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
 *                                                    SECTION META
 *=======================================================================================================================**/
/**==============================================
 * *                   INFO MetaShape
 *   On défini des méta figure comme étant un
 * ensemble de points, configurés pour être reliés
 * par des chemins.
 * 
 * On utilisera des lettres Grec pour nommer les points
 * 
 * La configuration des chemins choisis fera la 
 * figure concrète
 *   
 * Par exemple la MetaShape Pentagone, peut
 * gérer l'affichage de Pentagone et de Pentagramme
 * 
 *=============================================**/

/**==============================================
 * *                   INFO point
 *   Les points sont destinés à construire des 
 * figures.
 * 
 * Ils ne sont pas suffisant pour 
 * tracer des segments pertinents à l'affichage 
 * de figures d'interférence.
 * 
 * Lorsque c'est nécessaire, on définit alors des 
 * offset.
 *=============================================**/

/**==============================================
 * *                   INFO offset
 *   Les offsets sont des points secondaires, qui
 * servent à terminer les segments de façon à 
 * couvrir une zone de tracé plus importante.
 * 
 * Puisqu'ils servent à couvrir, les offsets 
 * peuvent être situé en dehors de la zone de dessin
 *=============================================**/

/**==============================================
 * *                   INFO MetaSquare
 
 Exemple: Disposition du MetaSquare
 --------
          +--width---->

     +    +           +
     |    α           δ
     |
  height
     |
     |
     v    +           +
          β           γ


  Exemple: Disposition des offsets du MetaSquare
  --------
                        offset δ

                           +
                           ^
                           |
                           |
                           
    + <------  +           +
 offset α      α           δ




               +           +  --------> +
               β           γ           offset γ

               |
               |
               |
               v
               +
          offset β
 *=============================================**/
class MetaSquare {
  static sides(size = Player.sizeCm) {
    return {
      widthInCentimeter: size,
      heightInCentimeter: size,
      width: Tools.convertCentimeterToPixel(size),
      height: Tools.convertCentimeterToPixel(size)
    }
  }
  static point = {
    gamma: function getSquareGamma({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: width,
        y: height
      };
    },
    beta: function getSquareBeta({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: 0,
        y: height
      };
    },
    alpha: function getSquareAlpha({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: 0,
        y: 0
      };
    },
    delta: function getSquareDelta({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
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
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: width,
        y: -height
      };
    },
    gamma: function getSquareGammaOffset({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: 2 * width,
        y: height
      };
    },
    beta: function getSquareBetaOffset({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: 0,
        y: 2 * height
      };
    },
    alpha: function getSquareAlphaOffset({
      width,
      height
    } = ShapeManager.getWidthAndHeight()) {
      return {
        x: -width,
        y: 0
      };
    }
  }
}
/**================================================================================================
 *                                         SECTION SHAPE
 *================================================================================================**/
class SquareShape {
  static angle = 90
  meta = MetaSquare
  paths = function getSquarePaths({
    width,
    height
  } = ShapeManager.getWidthAndHeight()) {
    return [
      [MetaSquare.point.alpha({
        width,
        height
      }), MetaSquare.offset.beta({
        width,
        height
      })],
      [MetaSquare.point.beta({
        width,
        height
      }), MetaSquare.offset.gamma({
        width,
        height
      })],
      [MetaSquare.point.gamma({
        width,
        height
      }), MetaSquare.offset.delta({
        width,
        height
      })],
      [MetaSquare.point.delta({
        width,
        height
      }), MetaSquare.offset.alpha({
        width,
        height
      })],
    ];
  }
}

class ZShape {
  meta = MetaSquare
  static angle = 90
  paths = function getLinePaths({
    width,
    height
  } = ShapeManager.getWidthAndHeight()) {
    return [
      [MetaSquare.point.alpha({
        width,
        height
      }), MetaSquare.point.gamma({
        width,
        height
      })],
      [MetaSquare.point.gamma({
        width,
        height
      }), MetaSquare.point.alpha({
        width,
        height
      })],
    ];
  }
}


class LineShape {
  meta = MetaSquare
  static angle = 90
  paths = function getLinePaths({
    width,
    height
  } = ShapeManager.getWidthAndHeight()) {
    return [
      [MetaSquare.point.alpha({
        width,
        height
      }), MetaSquare.offset.beta({
        width,
        height
      })],
      [MetaSquare.point.gamma({
        width,
        height
      }), MetaSquare.offset.delta({
        width,
        height
      })],
    ];
  }
}


class ShapeManager {
  static shapes = [SquareShape, ZShape, LineShape];
  static getWidthAndHeight(currentShapeName = Page.currentShapeName, sizeCM = Player.sizeCm) {
    return ShapeManager
      .getNew(currentShapeName)
      .meta
      .sides(sizeCM)
  }
  static getNew(currentShapeName = Page.currentShapeName) {
    const Class = ShapeManager.getClass(currentShapeName)
    return new Class();
  }
  static getClass(currentShapeName = Page.currentShapeName) {
    const shape = ShapeManager.shapes.find(shape => shape.name === currentShapeName);
    if (!shape) {
      throw Error(`Unknown currentShapeName (${currentShapeName})`)
    }
    return shape;
  }
  static getReferenceAngle(currentShapeName = Page.currentShapeName) {
    return ShapeManager.getClass(currentShapeName).angle;
  }
}

/**================================================================================================
 *                                         SECTION GEOMETRY
 *================================================================================================**/
/**==============================================
 * *                   INFO Geometry
 *   Récupère le tracé d'une figure concrète.
 * 
 * Puisque les points sont calculés
 * en fonction de la  taille du container,
 * qui évolue suivant la figure à afficher, 
 * on passe par un  Singleton qui met en 
 * cache ces valeurs.
 *=============================================**/
let Geometry = (function DataModule() {
  let _data = {};
  return {
    getPathsList: function (currentShapeName = Page.currentShapeName) {
      if (!_data[currentShapeName]) {
        _data[currentShapeName] = ShapeManager.getNew(currentShapeName).paths()
      }
      return [..._data[currentShapeName]]
    }
  };
})()
/**=======================================================================================================================
 *                                         SECTION PAGE
 *=======================================================================================================================**/
class Page {
  static currentShapeName = 'SquareShape'
  static load(currentShapeName = Page.currentShapeName) {
    Page.updateDataset(currentShapeName);
    Player.renderFrame({
      currentShapeName
    })
  }
  static updateDataset(currentShapeName) {
    Page.currentShapeName = currentShapeName;
    SVGManager.initContainer(ShapeManager.getWidthAndHeight(currentShapeName));

  }
  static init() {
    Page.renderMenu();
    Page.load(Page.currentShapeName)
  }
  static renderMenu() {
    document.getElementById('menu').innerHTML = ShapeManager.shapes
      .reduce((menuItems, shape) => [...menuItems, shape.name], [])
      .map(shape => Page.renderMenuItem(shape))
      .join('');
  }
  static renderMenuItem(shape) {
    return [`<li class="nav-item">`,
      `<a class="nav-link" href="#" onclick="Page.load('${shape}')">${shape.replace(/Shape/, '')}</a>`,
      `</li>`
    ].join('');
  }
  static toggleDebug() {
    Page.hideForm();
    Page.showDebug();
  }
  static showDebug() {
    Page.toggleOn('tab-debug');
    document.getElementById('tab-debug-content').hidden = false;
  }
  static hideForm() {
    Page.toggleOff('tab-form');
    document.getElementById('tab-form-content').hidden = true;
  }
  static toggleForm() {
    Page.hideDebug();
    Page.showForm();
  }
  static showForm() {
    Page.toggleOn('tab-form');
    document.getElementById('tab-form-content').hidden = false;
  }
  static hideDebug() {
    Page.toggleOff('tab-debug');
    document.getElementById('tab-debug-content').hidden = true;
  }
  static toggleOff(elementID) {
    const htmlElement = document.getElementById(elementID);
    htmlElement.className = [...htmlElement.classList]
      .filter(e => e !== 'active')
      .join(' ');
  }
  static toggleOn(elementID) {
    const htmlElement = document.getElementById(elementID);
    htmlElement.className = [...htmlElement.classList, 'active'].join(' ')
  }

}