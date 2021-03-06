import { Vertex } from "./vertex.js";
import { Triangle } from "./triangle.js";
import { Edge } from "./edge.js";

class AssignmentService {
    constructor() {}

    buildVertices(positions, vectors) {
        let result = [];
        let index = 0;
        for (let i = 0; i < positions.length; i+=3) {
            let x = positions[i];
            let y = positions[i+1];
            let vx = vectors[i];
            let vy = vectors[i+1];
            result.push(new Vertex(x, y, vx, vy, index));
            index++;
        }
        return result;
    }

    buildTriangles(vertices, indices, isReversedIndices=false) {
        let result = [];
        let index = 0;
        for (let i = 0; i < indices.length; i+=3) {
            let vertex1 = vertices[indices[i]];
            let vertex2 = vertices[indices[i+1]];
            let vertex3 = vertices[indices[i+2]];
            result.push(new Triangle(vertex1, vertex3, vertex2, index, isReversedIndices));
            index++;
        }
        return result;
    }

    buildEdges(triangles, vertices) {
        let result = [];
        let map = new Map();
        let edgeIndex = 0;
        triangles.forEach((triangle) => {
            let buildEdgeKey = (vertexIndex1, vertexIndex2) =>
                Math.min(vertexIndex1, vertexIndex2) + '-' + Math.max(vertexIndex1, vertexIndex2);
            let edge1Key = buildEdgeKey(triangle.vertex1.index, triangle.vertex2.index);
            let edge2Key = buildEdgeKey(triangle.vertex2.index, triangle.vertex3.index);
            let edge3Key = buildEdgeKey(triangle.vertex3.index, triangle.vertex1.index);
            if (!map.has(edge1Key)) {
                map.set(edge1Key, []);
            }
            if (!map.has(edge2Key)) {
                map.set(edge2Key, []);
            }
            if (!map.has(edge3Key)) {
                map.set(edge3Key, []);
            }
            map.get(edge1Key).push(triangle);
            map.get(edge2Key).push(triangle);
            map.get(edge3Key).push(triangle);
        });
        map.forEach((edgeTriangles, edgeKey) => {
            let keys = edgeKey.split('-');
            let key1 = parseInt(keys[0]);
            let key2 = parseInt(keys[1]);
            let vertex1 = vertices[key1];
            let vertex2 = vertices[key2];
            let triangle1 = edgeTriangles[0];
            let triangle2 = undefined;
            if (edgeTriangles.length === 2) {
                triangle2 = edgeTriangles[1];
            }
            let edge = new Edge(edgeIndex, edgeKey, vertex1, vertex2, triangle1, triangle2);
            result.push(edge);
            edgeIndex++;
            triangle1.addEdge(edge);
            if (triangle2) {
                triangle2.addEdge(edge);
            }
        });
        return result;
    }

    getFixedPoints(triangles) {
        console.log('getting fixed points');
        let fixedPts = [];
		let saddles = [];
        let sources = [];
        let sinks = [];
        for (let i = 0; i < triangles.length; i++) {
            let triangle = triangles[i];
            let poincareIndex = triangle.getPoincareIndex();

            if (Math.abs(poincareIndex - 1) < Math.pow(10, -6)) {
                // close to 1
                fixedPts.push(triangle);
                let eigenvalue = triangle.getEigenvalues();
                if(eigenvalue.x[0] > 0 && eigenvalue.x[1] > 0)
                    sources.push(triangle);
                else if(eigenvalue.x[0] < 0 && eigenvalue.x[1] < 0)
                    sinks.push(triangle);
            } else if (Math.abs(poincareIndex + 1) < Math.pow(10, -6)) {
                // close to -1
                saddles.push(triangle);
            }
        }
        console.log('done getting fixed points');
        return { fixedPts, sources, sinks, saddles };
    }

    getBarycentricWeights(triangle, newX, newY) {
        let v1 = triangle.vertex1;
        let v2 = triangle.vertex2;
        let v3 = triangle.vertex3;
        let w1 = ((v2.y - v3.y) * (newX - v3.x) + (v3.x - v2.x) * (newY - v3.y)) /
            ((v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y));
        let w2 = ((v3.y - v1.y) * (newX - v3.x) + (v1.x - v3.x) * (newY - v3.y)) /
            ((v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y));
        let w3 = 1 - w1 - w2;
        return { w1, w2, w3 };
    }

    getInterpolatedVectorValues(triangle, barycentricWeights) {
        let vx = triangle.vertex1.vx * barycentricWeights.w1 +
            triangle.vertex2.vx * barycentricWeights.w2 +
            triangle.vertex3.vx * barycentricWeights.w3;
        let vy = triangle.vertex1.vy * barycentricWeights.w1 +
            triangle.vertex2.vy * barycentricWeights.w2 +
            triangle.vertex3.vy * barycentricWeights.w3;
        return { vx, vy };
    }

    getAllStreamlines(triangles, stepSize=0.015) {
        console.log('start getting streamlines');
        let result = [];
        let vertexCache = new Set();
        for (let i = 0; i < triangles.length; i++) {
            let triangle = triangles[i];
            for (let k = 0; k < triangle.getVertices().length; k++) {
                let vertex = triangle.getVertices()[k];
                if (vertexCache.has(vertex.index))
                    continue;
                vertexCache.add(vertex.index);
                let forwardTrace = this.traceStreamline(triangles, triangle, vertex, stepSize);
                let backwardTrace = this.traceStreamline(triangles, triangle, vertex, stepSize, true).reverse();
                backwardTrace.pop();
                let combined = [ ...backwardTrace, ...forwardTrace];
                if (combined.length > 1)
                    result.push(combined);
            }
        }
        console.log('Number of streamlines: ' + result.length);
        console.log('done getting streamlines');
        return result;
    }

    traceStreamline(triangles, triangle, vertex, stepSize, backward=false) {
        let direction = backward ? -1 : 1;
        let visitedTriangles = new Set();
        let error = false;
        let currTriangleIndex = triangle.index;
        let newTriangleIndex = triangle.index;
        let currentPoint = vertex;
        let pts = [currentPoint];
        let newX = 0;
        let newY = 0;
        while ((!visitedTriangles.has(newTriangleIndex) || currTriangleIndex === newTriangleIndex) && pts.length < 500) {
            visitedTriangles.add(newTriangleIndex);
            currTriangleIndex = newTriangleIndex;
            newX = currentPoint.x + direction * currentPoint.vx * stepSize;
            newY = currentPoint.y + direction * currentPoint.vy * stepSize;

            if (newX < 0 || newY < 0 || newX > 1 || newY > 1)
                break;

            let baryWeights = this.getBarycentricWeights(triangles[currTriangleIndex], newX, newY);
            let vecComponents = undefined;
            if (Math.min(baryWeights.w1, baryWeights.w2, baryWeights.w3) < 0) {
                // in new triangle, find new triangle, find new barycentric weights for vectors
                let found = false;
                let neighbors = triangles[currTriangleIndex].getNeighboringTriangles(4);
                let weights = [];
                let d = new Map();
                for (let i = 0; i < neighbors.length; i++) {
                    let neighborTriangle = neighbors[i];
                    let neighborWeights = this.getBarycentricWeights(neighborTriangle, newX, newY);
                    weights.push(neighborWeights);
                    neighborTriangle.edges.forEach((edge, key) => {
                        d.set(key, this.distanceFromEdge(newX, newY, edge));
                    });
                    if (Math.min(neighborWeights.w1, neighborWeights.w2, neighborWeights.w3) > 0) {
                        vecComponents = this.getInterpolatedVectorValues(neighborTriangle, neighborWeights);
                        newTriangleIndex = neighborTriangle.index;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log('NO NEIGHBOR FOUND');
                }
            } else {
                // in same triangle
                vecComponents = this.getInterpolatedVectorValues(triangles[currTriangleIndex], baryWeights);
            }
            if (!vecComponents) {
                error = true;
                break;
            } else {
                currentPoint = new Vertex(newX, newY, vecComponents.vx, vecComponents.vy);
                pts.push(currentPoint);
            }
        }
        if (!error) {
            return pts;
        }
        return [];
    }

    getPeriodicOrbits(triangles, fixedPointTriangleIndices, stepSize=0.015) {
        console.log('start getting periodic orbits');
        let result = [];
        let vertexCache = new Set();
        let skipTrianglesForward = new Set();
        let skipTrianglesBackward = new Set();
        for (let i = 0; i < triangles.length; i++) {
            let triangle = triangles[i];
            if (fixedPointTriangleIndices.has(triangle.index)) {
                continue;
            }
            for (let k = 0; k < triangle.getVertices().length; k++) {
                let vertex = triangle.getVertices()[k];
                if (vertexCache.has(vertex.index))
                    continue;
                vertexCache.add(vertex.index);
                let forwardTrace = this.tracePeriodicOrbit(triangles, triangle, vertex, stepSize, fixedPointTriangleIndices, skipTrianglesForward);
                let backwardTrace = this.tracePeriodicOrbit(triangles, triangle, vertex, stepSize, fixedPointTriangleIndices, skipTrianglesBackward, true);
                if (forwardTrace.trace.length > 500 || backwardTrace.trace.length > 500) {
                    let trace = [];
                    if (forwardTrace.trace.length > backwardTrace.trace.length) {
                        trace = this.tracePeriodicOrbitFromPoint(triangles, forwardTrace.lastTriangle,
                            forwardTrace.lastVertex, stepSize, fixedPointTriangleIndices);
                    } else {
                        trace = this.tracePeriodicOrbitFromPoint(triangles, backwardTrace.lastTriangle,
                            backwardTrace.lastVertex, stepSize, fixedPointTriangleIndices, true);
                    }
                    result.push(trace);
                }
            }
        }
        console.log('Number of periodic orbits: ' + result.length);
        console.log('done getting periodic orbits');
        return result;
    }

    tracePeriodicOrbit(triangles, triangle, vertex, stepSize, fixedPointTriangleIndices, skipTriangles, backward=false) {
        let direction = backward ? -1 : 1;
        let visitedTriangles = new Set();
        let error = false;
        let currTriangleIndex = triangle.index;
        let newTriangleIndex = triangle.index;
        let currentPoint = vertex;
        let pts = [currentPoint];
        let newX = 0;
        let newY = 0;
        while ((!visitedTriangles.has(newTriangleIndex) || currTriangleIndex === newTriangleIndex)) {
            visitedTriangles.add(newTriangleIndex);
            currTriangleIndex = newTriangleIndex;

            let currTriangle = triangles[currTriangleIndex];
            if (skipTriangles.has(currTriangle.index)) {
                visitedTriangles.forEach((triangleIndex) => skipTriangles.add(triangleIndex));
                return {
                    trace: []
                };
            }
            if (fixedPointTriangleIndices.has(currTriangle.index)){
                visitedTriangles.forEach((triangleIndex) => skipTriangles.add(triangleIndex));
                return {
                    trace: []
                };
            }

            newX = currentPoint.x + direction * currentPoint.vx * stepSize;
            newY = currentPoint.y + direction * currentPoint.vy * stepSize;

            if (newX < 0 || newY < 0 || newX > 1 || newY > 1) {
                visitedTriangles.forEach((triangleIndex) => skipTriangles.add(triangleIndex));
                return {
                    trace: []
                };
            }

            let baryWeights = this.getBarycentricWeights(currTriangle, newX, newY);
            let vecComponents = undefined;
            if (Math.min(baryWeights.w1, baryWeights.w2, baryWeights.w3) < 0) {
                // in new triangle, find new triangle, find new barycentric weights for vectors
                let found = false;
                let neighbors = currTriangle.getNeighboringTriangles(3);
                for (let i = 0; i < neighbors.length; i++) {
                    let neighborTriangle = neighbors[i];
                    let neighborWeights = this.getBarycentricWeights(neighborTriangle, newX, newY);
                    if (Math.min(neighborWeights.w1, neighborWeights.w2, neighborWeights.w3) > 0) {
                        vecComponents = this.getInterpolatedVectorValues(neighborTriangle, neighborWeights);
                        newTriangleIndex = neighborTriangle.index;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log('NO NEIGHBOR FOUND');
                }
            } else {
                // in same triangle
                vecComponents = this.getInterpolatedVectorValues(currTriangle, baryWeights);
            }
            if (!vecComponents) {
                error = true;
                break;
            } else {
                currentPoint = new Vertex(newX, newY, vecComponents.vx, vecComponents.vy);
                pts.push(currentPoint);
            }
        }
        if (!error && pts.length > 1) {
            visitedTriangles.forEach((triangleIndex) => skipTriangles.add(triangleIndex));
            let lastTriangle = triangles[newTriangleIndex];
            let lastVertex = pts[pts.length-1];
            return {
                trace: pts,
                lastTriangle: lastTriangle,
                lastVertex: lastVertex
            };
        }
        return {
            trace: []
        };
    }

    tracePeriodicOrbitFromPoint(triangles, lastTriangle, lastVertex, stepSize, fixedPointTriangleIndices, backward=false) {
        let direction = backward ? -1 : 1;
        let visitedTriangles = new Set();
        let error = false;
        let currTriangleIndex = lastTriangle.index;
        let newTriangleIndex = lastTriangle.index;
        let currentPoint = lastVertex;
        let pts = [currentPoint];
        let newX = 0;
        let newY = 0;
        while ((!visitedTriangles.has(newTriangleIndex) || currTriangleIndex === newTriangleIndex)) {
            visitedTriangles.add(newTriangleIndex);
            currTriangleIndex = newTriangleIndex;

            let currTriangle = triangles[currTriangleIndex];
            if (fixedPointTriangleIndices.has(currTriangle.index)){
                return [];
            }

            newX = currentPoint.x + direction * currentPoint.vx * stepSize;
            newY = currentPoint.y + direction * currentPoint.vy * stepSize;

            if (newX < 0 || newY < 0 || newX > 1 || newY > 1)
                return [];

            let baryWeights = this.getBarycentricWeights(currTriangle, newX, newY);
            let vecComponents = undefined;
            if (Math.min(baryWeights.w1, baryWeights.w2, baryWeights.w3) < 0) {
                // in new triangle, find new triangle, find new barycentric weights for vectors
                let found = false;
                let neighbors = currTriangle.getNeighboringTriangles(3);
                for (let i = 0; i < neighbors.length; i++) {
                    let neighborTriangle = neighbors[i];
                    let neighborWeights = this.getBarycentricWeights(neighborTriangle, newX, newY);
                    if (Math.min(neighborWeights.w1, neighborWeights.w2, neighborWeights.w3) > 0) {
                        vecComponents = this.getInterpolatedVectorValues(neighborTriangle, neighborWeights);
                        newTriangleIndex = neighborTriangle.index;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log('NO NEIGHBOR FOUND');
                }
            } else {
                // in same triangle
                vecComponents = this.getInterpolatedVectorValues(currTriangle, baryWeights);
            }
            if (!vecComponents) {
                error = true;
                break;
            } else {
                currentPoint = new Vertex(newX, newY, vecComponents.vx, vecComponents.vy);
                pts.push(currentPoint);
            }
        }
        if (!error && pts.length > 1) {
            return pts;
        }
        return [];
    }

    isFarFromFixedPoint(triangles, fixedPointTriangleIndices, lastTriangleIndex) {
        let threshold = 0.5;
        let lastTriangle = triangles[lastTriangleIndex];
        for (let index of fixedPointTriangleIndices.entries()) {
            let fixedPointTriangle = triangles[index[0]];
            if (lastTriangle.distanceFrom(fixedPointTriangle) < threshold) {

                return false;
            }
        }
        return true;
    }

    distanceFromEdge(newX, newY, edge) {
        let x1 = edge.vertex1.x;
        let x2 = edge.vertex2.x;
        let y1 = edge.vertex1.y;
        let y2 = edge.vertex2.y;
        return Math.abs((y2 - y1) * newX - (x2 - x1) * newY + x2*y1 - y2*x1) /
            Math.sqrt(Math.pow((y2-y1), 2) + Math.pow((x2-x1), 2));
    }

    getMagnitude(vecComponents) {
        return Math.sqrt(Math.pow(vecComponents.vx, 2) + Math.pow(vecComponents.vy, 2));
    }
}

export { AssignmentService };