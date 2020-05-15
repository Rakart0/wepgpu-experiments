document.addEventListener( "DOMContentLoaded", init, false );

var vertSpirv = new Uint32Array([119734787, 65536, 524295, 30, 0, 131089, 1, 393227, 1, 1280527431, 1685353262, 808793134, 0, 196622, 0, 1, 589839, 0, 4, 1852399981, 0, 9, 11, 16, 20, 196611, 2, 450, 589828, 1096764487, 1935622738, 1918988389, 1600484449, 1684105331, 1868526181, 1667590754, 29556, 589828, 1096764487, 1935622738, 1768186216, 1818191726, 1969712737, 1600481121, 1882206772, 7037793, 262149, 4, 1852399981, 0, 327685, 9, 1131705711, 1919904879, 0, 262149, 11, 1866690153, 7499628, 393221, 14, 1348430951, 1700164197, 2019914866, 0, 393222, 14, 0, 1348430951, 1953067887, 7237481, 196613, 16, 0, 262149, 20, 1867542121, 115, 262215, 9, 30, 0, 262215, 11, 30, 1, 327752, 14, 0, 11, 0, 196679, 14, 2, 262215, 20, 30, 0, 131091, 2, 196641, 3, 2, 196630, 6, 32, 262167, 7, 6, 3, 262176, 8, 3, 7, 262203, 8, 9, 3, 262176, 10, 1, 7, 262203, 10, 11, 1, 262167, 13, 6, 4, 196638, 14, 13, 262176, 15, 3, 14, 262203, 15, 16, 3, 262165, 17, 32, 1, 262187, 17, 18, 0, 262187, 6, 19, 1048576000, 262203, 10, 20, 1, 262187, 6, 22, 1065353216, 262176, 28, 3, 13, 327734, 2, 4, 0, 3, 131320, 5, 262205, 7, 12, 11, 196670, 9, 12, 262205, 7, 21, 20, 327761, 6, 23, 21, 0, 327761, 6, 24, 21, 1, 327761, 6, 25, 21, 2, 458832, 13, 26, 23, 24, 25, 22, 327822, 13, 27, 26, 19, 327745, 28, 29, 16, 18, 196670, 29, 27, 65789, 65592]);
var fragSpirv = new Uint32Array([119734787, 65536, 524295, 19, 0, 131089, 1, 393227, 1, 1280527431, 1685353262, 808793134, 0, 196622, 0, 1, 458767, 4, 4, 1852399981, 0, 9, 12, 196624, 4, 7, 196611, 2, 450, 589828, 1096764487, 1935622738, 1918988389, 1600484449, 1684105331, 1868526181, 1667590754, 29556, 589828, 1096764487, 1935622738, 1768186216, 1818191726, 1969712737, 1600481121, 1882206772, 7037793, 262149, 4, 1852399981, 0, 393221, 9, 1182037359, 1130848626, 1919904879, 0, 262149, 12, 1866690153, 7499628, 262215, 9, 30, 0, 262215, 12, 30, 0, 131091, 2, 196641, 3, 2, 196630, 6, 32, 262167, 7, 6, 4, 262176, 8, 3, 7, 262203, 8, 9, 3, 262167, 10, 6, 3, 262176, 11, 1, 10, 262203, 11, 12, 1, 262187, 6, 14, 1065353216, 327734, 2, 4, 0, 3, 131320, 5, 262205, 10, 13, 12, 327761, 6, 15, 13, 0, 327761, 6, 16, 13, 1, 327761, 6, 17, 13, 2, 458832, 7, 18, 15, 16, 17, 14, 196670, 9, 18, 65789, 65592]);


async function init()
{

    //On vérifie que le navigateur est compatible WebGPU
    var entry = navigator.gpu;
    if(entry == null)
    {
        alert("WebGPU n'est pas supporté par ce navigateur");
        return;
    }

//Initalisation de l'API

const adapter = await entry.requestAdapter();
const device = await adapter.requestDevice();
const queue = device.defaultQueue;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("gpupresent");

const swapChainDesc = {
    device: device,
    format: 'bgra8unorm',
    usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
};

//Création de la swapchain et des framebuffers

const swapchain = ctx.configureSwapChain(swapChainDesc);

const depthTextureDesc = {
    size: {
        width: canvas.width,
        height: canvas.height,
        depth: 1
    },
    mipLevelCount: 1,
    sampleCount: 1,
    dimension: '2d',
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
};

var depthTexture = device.createTexture(depthTextureDesc);
var depthTextureView = depthTexture.createView();

let colorTexture = swapchain.getCurrentTexture();
let colorTextureView = colorTexture.createView();

//Création des Vertices et Indices buffers

const positions = new Float32Array([
    1.0, -1.0, 0.0,
   -1.0, -1.0, 0.0,
    0.0,  1.0, 0.0
]);

const colors = new Float32Array([
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0 
]);

const indices = new Uint16Array([ 0, 1, 2 ]);

let positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX, device);
let colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX, device);
let indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX, device);

let frag = await loadShader("/shaders/triangle.frag.spv")
let vert = await loadShader("/shaders/triangle.vert.spv")

let fragModule = device.createShaderModule({code : frag});
let vertModule = device.createShaderModule({code : vert});

// Je sais pas ce qu'est cette déclaration cheloue d'array dans le tuto
// const uniformData = new Float32Array([

//     1.0, 0.0, 0.0, 0.0
//     0.0, 1.0, 0.0, 0.0
//     0.0, 0.0, 1.0, 0.0
//     0.0, 0.0, 0.0, 1.0

//     0.9, 0.1, 0.3, 1.0

//     0.8, 0.2, 0.8, 1.0
// ]);


// // 📁 Bind Group Layout
// let uniformBindGroupLayout = device.createBindGroupLayout({
//     bindings: [{
//         binding: 0,
//         visibility: GPUShaderStage.VERTEX,
//         type: "uniform-buffer"
//     }]
// });

// // 🗄️ Bind Group
// // ✍ This would be used when encoding commands
// let uniformBindGroup = device.createBindGroup({
//     layout: uniformBindGroupLayout,
//     bindings: [{
//         binding: 0,
//         resource: {
//             buffer: uniformBuffer
//         }
//     }]
// });

// 🗂️ Pipeline Layout
// 👩‍🔧 this would be used as a member of a GPUPipelineDescriptor
let layout = device.createPipelineLayout( {bindGroupLayouts: []});


const positionAttribDesc = {
    shaderLocation: 0, // [[attribute(0)]]
    offset: 0,
    format: 'float3'
};

const colorAttribDesc = {
    shaderLocation: 1, // [[attribute(1)]]
    offset: 0,
    format: 'float3'
};
const positionBufferDesc = {
    attributes: [ positionAttribDesc ],
    arrayStride: 4 * 3, // sizeof(float) * 3
    stepMode: 'vertex'
};
const colorBufferDesc = {
    attributes: [ colorAttribDesc ],
    arrayStride: 4 * 3, // sizeof(float) * 3
    stepMode: 'vertex'
};

const vertexState = {
    indexFormat: 'uint16',
    vertexBuffers: [ positionBufferDesc, colorBufferDesc ]
};

const vertexStage = {
    module: vertModule,
    entryPoint: 'main'
};

const fragmentStage = {
    module: fragModule,
    entryPoint: 'main'
};

const depthStencilState = {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus-stencil8'
};

// 🍥 Blend State
const colorState = {
    format: 'bgra8unorm',
    alphaBlend: {
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
    },
    colorBlend: {
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add'
    },
    writeMask: GPUColorWrite.ALL
};

// 🔺 Rasterization
const rasterizationState = {
    frontFace: 'cw',
    cullMode: 'none'
};

// 👩‍🔧 Create the Pipeline
const pipelineDesc = {
    layout,

    vertexStage,
    fragmentStage,

    primitiveTopology: 'triangle-list',
    colorStates: [ colorState ],
    depthStencilState,
    vertexState,
    rasterizationState
};

let pipeline = device.createRenderPipeline(pipelineDesc);

function encodeCommands() {
    let colorAttachment = {
        attachment: colorTextureView,
        loadValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store'
    };

    const depthAttachment = {
        attachment: depthTextureView,
        depthLoadValue: 1,
        depthStoreOp: 'store',
        stencilLoadValue: 'load',
        stencilStoreOp: 'store'
    };

    const renderPassDesc = {
        colorAttachments: [ colorAttachment ],
        depthStencilAttachment: depthAttachment
    };

    let commandEncoder = device.createCommandEncoder();

    // 🖌️ Encode drawing commands
     let passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setPipeline(pipeline);
    // passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);
    passEncoder.setIndexBuffer(indexBuffer);
    passEncoder.drawIndexed(3, 1, 0, 0, 0);
    passEncoder.endPass();

    queue.submit([ commandEncoder.finish() ]);
}
    let render = () => {
        // ⏭ Acquire next image from swapchain
        colorTexture = swapchain.getCurrentTexture();
        colorTextureView = colorTexture.createView();
    
        // 📦 Write and submit commands to queue
        encodeCommands();
    
        // ➿ Refresh canvas
        requestAnimationFrame(render);
    };

    render();
}

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

return shader;    // console.log(res.arrayBuffer().Uint32Array);
    

    // return new Uint32Array(arr);
}
