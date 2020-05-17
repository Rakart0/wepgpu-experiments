
class TrianglePrimitive
{
    static get vertices () {

     return new Float32Array([
            1.0, -1, 0.0,
            -1.0, -1, 0.0,
            0.0,  1, 0.0
        ]);
    }

    static get indices () {
        return new Uint16Array([0, 1, 2]);
    }
}