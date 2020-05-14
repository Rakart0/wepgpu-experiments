document.addEventListener( "DOMContentLoaded", init, false );


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

let fragmentShader = await loadShader('shaders/triangle.frag.spv');
let vertexShader = await loadShader('shaders/triangle.vert.spv');

let fragmentModule = device.createShaderModule(fragmentShader);
let vertexModule = device.createShaderModule(vertexShader);

// Je sais pas ce qu'est cette déclaration cheloue d'array dans le tuto
// const uniformData = new Float32Array([

//     1.0, 0.0, 0.0, 0.0
//     0.0, 1.0, 0.0, 0.0
//     0.0, 0.0, 1.0, 0.0
//     0.0, 0.0, 0.0, 1.0

//     0.9, 0.1, 0.3, 1.0

//     0.8, 0.2, 0.8, 1.0
// ]);


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
    //pipi
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
    var res = await fetch(new Request(shaderPath), { method: 'GET', mode: 'cors' });
    console.log(res == null);
    var arr = res.arrayBuffer();
    console.log(res.b)
    return new Uint32Array(arr);
}
