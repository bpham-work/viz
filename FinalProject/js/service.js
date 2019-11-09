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
            let z = positions[i+2];
            let vx = vectors[i];
            let vy = vectors[i+1];
            let vz = vectors[i+2];
            result.push(new Vertex(x, y, z, vx, vy, vz, index));
            index++;
        }
        return result;
    }

    buildTriangles(vertices, indices) {
        let result = [];
        let index = 0;
        for (let i = 0; i < indices.length; i+=3) {
            let vertex1 = vertices[indices[i]];
            let vertex2 = vertices[indices[i+1]];
            let vertex3 = vertices[indices[i+2]];
            result.push(new Triangle(vertex1, vertex2, vertex3, index));
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
        map.forEach((triangles, edgeKey) => {
            let keys = edgeKey.split('-');
            let key1 = parseInt(keys[0]);
            let key2 = parseInt(keys[1]);
            let vertex1 = vertices[key1];
            let vertex2 = vertices[key2];
            let triangle1 = triangles[0];
            let triangle2 = undefined;
            if (triangles.length === 2) {
                triangle2 = triangles[1];
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
}

export { AssignmentService };