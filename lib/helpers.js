function createBuffer(array, usage, device)
   {
    let desc = { size: array.byteLength, usage };
    let [ buffer, bufferMapped ] = device.createBufferMapped(desc);

    const writeArray =
        array instanceof Uint16Array ? new Uint16Array(bufferMapped) : new Float32Array(bufferMapped);
    writeArray.set(array);
    buffer.unmap();
    return buffer;
};

async function loadShader (shaderPath) 
{
    let shader;
    await fetch(new Request(shaderPath), { method: 'GET', mode: 'cors' }). 
        then(response => response.arrayBuffer().then(arr => shader = new Uint32Array(arr) ));

return shader;
}
